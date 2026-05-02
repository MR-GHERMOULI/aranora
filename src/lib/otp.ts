import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

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
 * Generate a new OTP, store it in the database, and send it via email
 */
export async function generateAndSendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    const admin = getAdminClient()
    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000).toISOString()

    try {
        // 1. Prevent email spam and conserve resources by rate-limiting OTP generation.
        // If an OTP was generated within the last 60 seconds, do not send a new one.
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
        const { data: recentOtp } = await admin
            .from('otp_codes')
            .select('id')
            .eq('email', email.toLowerCase())
            .eq('used', false)
            .gte('created_at', oneMinuteAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (recentOtp) {
            // Silently return success to allow the flow to continue to the verify screen,
            // but the user will just use the code they already received.
            return { success: true }
        }

        // 2. Invalidate any existing unused OTP codes for this email
        await admin
            .from('otp_codes')
            .update({ used: true })
            .eq('email', email.toLowerCase())
            .eq('used', false)

        // 2. Store the new OTP code
        const { error: insertError } = await admin
            .from('otp_codes')
            .insert({
                email: email.toLowerCase(),
                code,
                expires_at: expiresAt,
                used: false,
            })

        if (insertError) {
            console.error('Failed to store OTP code:', insertError)
            return { success: false, error: 'Failed to generate verification code.' }
        }

        // 3. Send the OTP via Resend
        const emailResult = await sendEmail({
            to: email,
            subject: `${code} is your Aranora verification code`,
            html: buildOtpEmailHtml(code),
        })

        if (emailResult.error) {
            console.error('Failed to send OTP email:', emailResult.error)
            // Rollback: Delete the unused code we just inserted so it doesn't trigger
            // the rate limiter on the user's next immediate attempt.
            await admin
                .from('otp_codes')
                .delete()
                .eq('email', email.toLowerCase())
                .eq('code', code)
                .eq('used', false)
            
            // Extract a helpful error message for the user/developer
            const errorDetail = typeof emailResult.error === 'string' 
                ? emailResult.error 
                : (emailResult.error as any).message || 'Unknown email delivery error';

            return { success: false, error: `Email error: ${errorDetail}` }
        }

        return { success: true }
    } catch (err) {
        console.error('OTP generation error:', err)
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
