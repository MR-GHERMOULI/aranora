import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAndSendOtp } from '@/lib/otp'

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

        // 2. Generate a new OTP and send it via Resend
        const result = await generateAndSendOtp(user.email)

        if (!result.success) {
            console.error('Send OTP error:', result.error)
            return NextResponse.json({ error: result.error || 'Failed to send verification code.' }, { status: 500 })
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
