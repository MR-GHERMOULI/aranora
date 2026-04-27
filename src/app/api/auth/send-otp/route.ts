import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Invalidate any existing MFA verification for this session to ensure
        // that the user MUST verify the fresh code.
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        cookieStore.delete('aranora_mfa_verified')

        // 2. Generate a fresh 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

        // 3. Store OTP in user metadata using the Admin Client
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminSupabase = createAdminClient()
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...(user.user_metadata || {}),
                otp_code: otpCode,
                otp_expires_at: otpExpiresAt,
            }
        })

        if (updateError) {
            console.error('Failed to store OTP in metadata:', updateError)
            return NextResponse.json({ error: 'Failed to initialize verification.' }, { status: 500 })
        }

        // 4. Send the OTP email via Resend
        const { sendEmail } = await import('@/lib/email')
        const { error: emailError } = await sendEmail({
            to: user.email,
            subject: `${otpCode} is your Aranora verification code`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #1E3A5F; margin-top: 0;">Verification Code</h2>
                    <p>Hello,</p>
                    <p>Use the code below to complete your sign-in to Aranora:</p>
                    <div style="background: #f8fafc; border: 2px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1E3A5F;">${otpCode}</span>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2026 Aranora. All rights reserved.</p>
                </div>
            `
        })

        if (emailError) {
            console.error('Failed to resend OTP via Resend:', emailError)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        const maskedEmail = maskEmail(user.email)
        return NextResponse.json({ success: true, maskedEmail })
    } catch (err) {
        console.error('Send OTP error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
}
