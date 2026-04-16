import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
                // --- Track affiliate referral for OAuth signups ---
                try {
                    const cookieStore = await cookies();
                    const refCode = cookieStore.get('aranora_ref')?.value || cookieStore.get('aranora_ref_code')?.value;

                    if (refCode) {
                        const serviceClient = createServerClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.SUPABASE_SERVICE_ROLE_KEY!,
                            { cookies: { getAll() { return [] }, setAll() { } } }
                        );

                        const { data: affiliate } = await serviceClient
                            .from('affiliates')
                            .select('id')
                            .eq('affiliate_code', refCode)
                            .in('status', ['active', 'pending'])
                            .single();

                        if (affiliate) {
                            const { data: existingRef } = await serviceClient
                                .from('affiliate_referrals')
                                .select('id')
                                .eq('affiliate_id', affiliate.id)
                                .eq('referred_user_id', user.id)
                                .single();

                            if (!existingRef) {
                                await serviceClient.from('affiliate_referrals').insert({
                                    affiliate_id: affiliate.id,
                                    referred_user_id: user.id,
                                    status: 'signed_up',
                                });

                                await serviceClient
                                    .from('profiles')
                                    .update({ referred_by_affiliate: refCode })
                                    .eq('id', user.id);
                            }
                        }
                    }
                } catch (e) {
                    console.error('OAuth referral tracking error:', e);
                }

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
