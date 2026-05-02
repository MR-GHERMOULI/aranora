import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// OTP code length
const OTP_LENGTH = 6
// OTP validity in minutes
const OTP_VALIDITY_MINUTES = 10

/**
 * Generate a cryptographically random OTP code
 */
function generateOtpCode(): string {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    // Generate a 6-digit code, zero-padded
    return String(array[0] % 1000000).padStart(OTP_LENGTH, '0')
}

/**
 * Get a Supabase admin client for OTP operations
 */
function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        }
    )
}

/**
 * Send OTP email directly via Resend SDK (bypasses shared helper for reliability).
 * Tries the primary sender first, falls back to onboarding@resend.dev if needed.
 */
async function sendOtpEmail(to: string, code: string, html: string): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        console.error('[OTP] RESEND_API_KEY is not set in environment variables!')
        return { success: false, error: 'Email service is not configured (missing API key).' }
    }

    const resend = new Resend(apiKey)
    const subject = `${code} is your Aranora verification code`

    // Try primary sender: noreply@aranora.com
    try {
        console.log(`[OTP] Sending OTP email to ${to} via noreply@aranora.com...`)
        const { data, error } = await resend.emails.send({
            from: 'Aranora <noreply@aranora.com>',
            to: [to],
            subject,
            html,
        })

        if (!error && data?.id) {
            console.log(`[OTP] ✅ Email sent successfully via primary sender. Resend ID: ${data.id}`)
            return { success: true }
        }

        console.warn(`[OTP] Primary sender failed:`, error)
    } catch (err) {
        console.warn(`[OTP] Primary sender threw exception:`, err)
    }

    // Fallback: try onboarding@resend.dev
    try {
        console.log(`[OTP] Retrying with fallback sender onboarding@resend.dev...`)
        const { data, error } = await resend.emails.send({
            from: 'Aranora <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
        })

        if (!error && data?.id) {
            console.log(`[OTP] ✅ Email sent successfully via fallback sender. Resend ID: ${data.id}`)
            return { success: true }
        }

        const errorMsg = error?.message || JSON.stringify(error)
        console.error(`[OTP] ❌ Fallback sender also failed:`, errorMsg)
        return { success: false, error: `Email delivery failed: ${errorMsg}` }
    } catch (err) {
        console.error(`[OTP] ❌ Fallback sender threw exception:`, err)
        return { success: false, error: 'Email service encountered an unexpected error.' }
    }
}

/**
 * Generate a new OTP, send it via email, and store it in the database ONLY after
 * the email is confirmed sent. This prevents orphaned codes that block future attempts.
 */
export async function generateAndSendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    const admin = getAdminClient()
    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000).toISOString()

    console.log(`[OTP] Starting OTP flow for ${email.substring(0, 3)}***`)

    try {
        // 1. Rate-limit: if an OTP was sent within the last 60 seconds, don't send another.
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
        const { data: recentOtp } = await admin
            .from('otp_codes')
            .select('id, created_at')
            .eq('email', email.toLowerCase())
            .eq('used', false)
            .gte('created_at', oneMinuteAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (recentOtp) {
            console.log(`[OTP] Rate-limited — recent code exists (created ${recentOtp.created_at}). Skipping send.`)
            return { success: true }
        }

        // 2. Send the email FIRST — don't touch the DB until we know the email went out.
        console.log(`[OTP] Sending email with code to ${email}...`)
        const emailResult = await sendOtpEmail(email, code, buildOtpEmailHtml(code))

        if (!emailResult.success) {
            console.error(`[OTP] ❌ Email send failed: ${emailResult.error}`)
            return { success: false, error: emailResult.error || 'Failed to send verification email.' }
        }

        // 3. Email confirmed sent — now invalidate old codes and store the new one.
        console.log(`[OTP] Email sent. Storing code in database...`)
        await admin
            .from('otp_codes')
            .update({ used: true })
            .eq('email', email.toLowerCase())
            .eq('used', false)

        const { error: insertError } = await admin
            .from('otp_codes')
            .insert({
                email: email.toLowerCase(),
                code,
                expires_at: expiresAt,
                used: false,
            })

        if (insertError) {
            console.error('[OTP] ⚠️ Code was emailed but failed to store in DB:', insertError)
            // Email was sent but DB storage failed — this is a non-fatal error.
            // The user received the code but verification will fail. 
            // Return success so they can at least try, and request a resend if needed.
            return { success: false, error: 'Code was sent but could not be saved. Please request a new code.' }
        }

        console.log(`[OTP] ✅ OTP flow complete for ${email.substring(0, 3)}***`)
        return { success: true }
    } catch (err) {
        console.error('[OTP] ❌ Unexpected error in OTP flow:', err)
        return { success: false, error: 'An unexpected error occurred.' }
    }
}

/**
 * Verify an OTP code against the database
 */
export async function verifyOtpCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
    const admin = getAdminClient()

    try {
        // Find a matching, unused, unexpired OTP code
        const { data, error } = await admin
            .from('otp_codes')
            .select('id, expires_at')
            .eq('email', email.toLowerCase())
            .eq('code', code)
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) {
            return { valid: false, error: 'Incorrect or expired code. Please try again.' }
        }

        // Check expiry
        if (new Date(data.expires_at) < new Date()) {
            // Mark as used so it can't be retried
            await admin.from('otp_codes').update({ used: true }).eq('id', data.id)
            return { valid: false, error: 'This code has expired. Please request a new one.' }
        }

        // Mark the code as used
        await admin.from('otp_codes').update({ used: true }).eq('id', data.id)

        return { valid: true }
    } catch (err) {
        console.error('OTP verification error:', err)
        return { valid: false, error: 'Verification failed. Please try again.' }
    }
}

/**
 * Build a beautiful HTML email for the OTP code
 */
function buildOtpEmailHtml(code: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Aranora</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:400;">Identity Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.6;">
                Enter the following code to verify your identity and continue to your dashboard:
              </p>
              <!-- OTP Code -->
              <div style="background:#f8f9fc;border:2px dashed #d0d5e0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1e3a5f;font-family:'Courier New',monospace;">${code}</span>
              </div>
              <p style="margin:0 0 8px;color:#666;font-size:13px;line-height:1.5;">
                ⏱ This code expires in <strong>${OTP_VALIDITY_MINUTES} minutes</strong>.
              </p>
              <p style="margin:0;color:#666;font-size:13px;line-height:1.5;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #eee;">
              <p style="margin:0;color:#999;font-size:11px;text-align:center;line-height:1.5;">
                🔒 This is an automated security email from Aranora.<br>
                Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
