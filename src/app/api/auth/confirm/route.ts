import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

async function redirectAfterAuth(
    origin: string,
    next: string,
    userId: string
): Promise<NextResponse> {
    const supabase = await createClient()
    const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return [] }, setAll() { } } }
    )

    // Fetch the profile, or create it if the DB trigger failed
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('id, is_admin, subscription_status')
        .eq('id', userId)
        .single()

    if (!profile) {
        // Profile missing — create it now (trigger may have silently failed)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const baseUsername = (user.email ?? 'user')
                .split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'
            const suffix = Math.random().toString(36).substring(2, 6)
            await serviceClient.from('profiles').insert({
                id: user.id,
                username: `${baseUsername}_${suffix}`,
                full_name: user.user_metadata?.full_name ?? '',
                email: user.email,
                company_email: user.email,
                phone: user.user_metadata?.phone ?? null,
                country: user.user_metadata?.country ?? null,
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                subscription_status: 'trialing',
            })
        }
        return NextResponse.redirect(`${origin}${next}`)
    }

    if (profile.is_admin) {
        return NextResponse.redirect(`${origin}/admin`)
    }
    if (profile.subscription_status === 'affiliate') {
        return NextResponse.redirect(`${origin}/affiliates`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    // ── Primary path: Supabase email confirmation (token_hash + type) ──
    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                return redirectAfterAuth(origin, next, user.id)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // ── Fallback: PKCE code flow (in case Supabase sends a code here) ──
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                return redirectAfterAuth(origin, next, user.id)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to login with an error message
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
