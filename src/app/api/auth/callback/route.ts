import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if user is admin or affiliate
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin, subscription_status')
                    .eq('id', user.id)
                    .single()

                if (profile?.is_admin) {
                    return NextResponse.redirect(`${origin}/admin`)
                }
                if (profile?.subscription_status === 'affiliate') {
                    return NextResponse.redirect(`${origin}/affiliates`)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to login with an error
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
