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

        // Verify the OTP natively using Supabase WITHOUT sending current cookies
        // This avoids conflicts where Supabase rejects verification because a session already exists
        const { createServerClient } = await import('@supabase/ssr')
        const anonSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return [] }, setAll() { } } }
        )

        const { error } = await anonSupabase.auth.verifyOtp({
            email: user.email,
            token: code,
            type: 'email' // 'email' type verifies the 6-digit OTP
        })

        if (error) {
            console.error('Supabase OTP Verification error:', error.message)
            return NextResponse.json({ error: 'Incorrect or expired code. Please try again.' }, { status: 400 })
        }

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
