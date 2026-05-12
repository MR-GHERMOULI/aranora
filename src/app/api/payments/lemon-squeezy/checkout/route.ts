import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { setupLemonSqueezy, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_VARIANTS } from '@/lib/lemonsqueezy';

export async function POST(request: NextRequest) {
    try {
        // Initialize LS
        setupLemonSqueezy();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planType, discountCode, affiliateCode: bodyAffCode } = await request.json();

        // Read affiliate code from request body or cookie
        const cookieAffCode = request.cookies.get('aranora_ref')?.value;
        const affiliateCode = bodyAffCode || cookieAffCode || '';

        if (!planType || !['monthly', 'yearly'].includes(planType)) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        const variantId = LEMONSQUEEZY_VARIANTS[planType as keyof typeof LEMONSQUEEZY_VARIANTS];

        if (!variantId) {
            return NextResponse.json({ error: 'Variant not configured' }, { status: 500 });
        }

        if (!LEMONSQUEEZY_STORE_ID) {
            return NextResponse.json({ error: 'Store ID not configured' }, { status: 500 });
        }

        // Get profile for full name and email
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Create Lemon Squeezy Checkout
        const { data: checkout, error } = await createCheckout(
            LEMONSQUEEZY_STORE_ID,
            variantId,
            {
                checkoutData: {
                    email: user.email,
                    name: profile?.full_name || undefined,
                    discountCode: discountCode || undefined,
                    custom: {
                        user_id: user.id,
                        plan_type: planType,
                        affiliate_code: affiliateCode,
                    },
                },
                productOptions: {
                    redirectUrl: `${request.nextUrl.origin}/billing?success=true`,
                },
                checkoutOptions: {
                    embed: false,
                    media: true,
                    logo: true,
                },
            }
        );

        if (error) {
            console.error('Lemon Squeezy error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const response = NextResponse.json({ url: checkout?.data.attributes.url });

        // Clear the referral cookie after checkout setup
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
