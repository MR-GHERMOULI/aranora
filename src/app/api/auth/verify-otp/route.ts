import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

function hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 // seconds

export async function POST(request: NextRequest) {
    try {
        const { code, rememberMe } = await request.json()

        if (!code || typeof code !== 'string' || code.length !== 6) {
            return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const serviceClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll() { return [] }, setAll() { } } }
        )

        const codeHash = hashCode(code)
        const now = new Date().toISOString()

        // Look for a valid, unused, unexpired OTP for this user
        const { data: otpRecord } = await serviceClient
            .from('login_otp_codes')
            .select('id, code_hash, expires_at, used_at')
            .eq('user_id', user.id)
            .is('used_at', null)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!otpRecord) {
            return NextResponse.json({ error: 'Code expired or not found. Please request a new code.' }, { status: 400 })
        }

        if (otpRecord.code_hash !== codeHash) {
            return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
        }

        // Mark code as used
        await serviceClient
            .from('login_otp_codes')
            .update({ used_at: now })
            .eq('id', otpRecord.id)

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
