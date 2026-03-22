import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planType, promoCode, affiliateCode: bodyAffCode } = await request.json();

        // Read affiliate code from request body or cookie
        const cookieAffCode = request.cookies.get('aranora_ref')?.value;
        const affiliateCode = bodyAffCode || cookieAffCode || '';

        if (!planType || !['monthly', 'yearly'].includes(planType)) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        const priceId = STRIPE_PRICES[planType as keyof typeof STRIPE_PRICES];
        if (!priceId) {
            return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
        }

        // Get or create Stripe customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, full_name')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: profile?.full_name || undefined,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            // Save customer ID to profile using service role
            const { createServerClient } = await import('@supabase/ssr');
            const serviceClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { cookies: { getAll() { return []; }, setAll() { } } }
            );
            await serviceClient
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        // Check for promo code — apply extended trial on the subscription
        let trialDays: number | undefined;
        if (promoCode) {
            const { createServerClient } = await import('@supabase/ssr');
            const serviceClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { cookies: { getAll() { return []; }, setAll() { } } }
            );

            const { data: promo } = await serviceClient
                .from('promo_invite_links')
                .select('*')
                .eq('code', promoCode)
                .eq('is_active', true)
                .single();

            if (promo && promo.times_used < promo.max_uses) {
                trialDays = promo.free_months * 30; // Approximate months as 30 days
            }
        }

        // Build checkout session params
        const sessionParams: Record<string, unknown> = {
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${request.nextUrl.origin}/billing?success=true`,
            cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
            metadata: {
                supabase_user_id: user.id,
                plan_type: planType,
                promo_code: promoCode || '',
                affiliate_code: affiliateCode,
            },
        };

        if (trialDays) {
            sessionParams.subscription_data = {
                trial_period_days: trialDays,
                metadata: {
                    supabase_user_id: user.id,
                    plan_type: planType,
                    promo_code: promoCode || '',
                    affiliate_code: affiliateCode,
                },
            };
        } else {
            sessionParams.subscription_data = {
                metadata: {
                    supabase_user_id: user.id,
                    plan_type: planType,
                    affiliate_code: affiliateCode,
                },
            };
        }

        const session = await stripe.checkout.sessions.create(
            sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
        );

        const response = NextResponse.json({ url: session.url });

        // Clear the referral cookie after checkout to prevent double-crediting
        if (affiliateCode) {
            response.cookies.set('aranora_ref', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/',
            });
        }

        return response;
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
