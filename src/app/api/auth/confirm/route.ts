import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

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
