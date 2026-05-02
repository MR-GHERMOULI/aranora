import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOtpCode } from '@/lib/otp'

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

        // Verify the OTP code against our database
        const result = await verifyOtpCode(user.email, code)

        if (!result.valid) {
            return NextResponse.json({ error: result.error || 'Incorrect or expired code. Please try again.' }, { status: 400 })
        }

        // Build the response and set the MFA cookie
        const response = NextResponse.json({ success: true })

        // Always set for 30 days as per user request ("once a month")
        const maxAge = THIRTY_DAYS

        response.cookies.set('aranora_mfa_verified', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge,
        })

        // Log access for security tracking
        try {
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
            const ua = request.headers.get('user-agent') || 'unknown'
            
            // Use service role for logging to bypass RLS if necessary
            const { createServerClient } = await import('@supabase/ssr')
            const serviceClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { cookies: { getAll() { return [] }, setAll() { } } }
            )

            await serviceClient.from('user_access_logs').insert({
                user_id: user.id,
                ip_address: ip,
                user_agent: ua
            })

            await serviceClient.from('profiles').update({
                last_ip: ip,
                last_ua: ua,
                last_login_at: new Date().toISOString()
            }).eq('id', user.id)
        } catch (logErr) {
            console.error('Failed to log verification access:', logErr)
        }

        return response
    } catch (err) {
        console.error('Verify OTP error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
