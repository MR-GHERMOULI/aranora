import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const THIRTY_DAYS = 30 * 24 * 60 * 60 // seconds

export async function POST(request: NextRequest) {
    try {
        const { code, rememberMe } = await request.json()

        if (!code || typeof code !== 'string' || code.length !== 6) {
            return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the custom OTP stored in user metadata
        const userMetadata = user.user_metadata || {}
        const storedCode = userMetadata.otp_code
        const expiresAt = userMetadata.otp_expires_at

        if (!storedCode || !expiresAt) {
            return NextResponse.json({ error: 'No verification code found. Please try logging in again.' }, { status: 400 })
        }

        if (new Date() > new Date(expiresAt)) {
            return NextResponse.json({ error: 'Verification code has expired. Please try logging in again.' }, { status: 400 })
        }

        if (storedCode !== code) {
            return NextResponse.json({ error: 'Incorrect verification code. Please try again.' }, { status: 400 })
        }

        // Clear the OTP from metadata after successful verification using Admin Client
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminSupabase = createAdminClient()
        await adminSupabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...userMetadata,
                otp_code: null,
                otp_expires_at: null,
            }
        })

        // Build the response and set the MFA cookie
        const response = NextResponse.json({ success: true })

        const maxAge = rememberMe ? THIRTY_DAYS : undefined // session cookie if no remember me

        response.cookies.set('aranora_mfa_verified', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            ...(maxAge ? { maxAge } : {}),
        })

        return response
    } catch (err) {
        console.error('Verify OTP error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
