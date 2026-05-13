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

        console.log('[LS Checkout] Store ID:', LEMONSQUEEZY_STORE_ID, '| Variant ID:', variantId);
        console.log('[LS Checkout] Store ID type:', typeof LEMONSQUEEZY_STORE_ID, '| Variant ID type:', typeof variantId);

        // Create Lemon Squeezy Checkout
        const checkoutResult = await createCheckout(
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

        console.log('[LS Checkout] Full result statusCode:', checkoutResult.statusCode);
        console.log('[LS Checkout] Error:', JSON.stringify(checkoutResult.error, null, 2));
        console.log('[LS Checkout] Data:', JSON.stringify(checkoutResult.data, null, 2)?.substring(0, 500));

        const { data: checkout, error } = checkoutResult;

        if (error) {
            console.error('Lemon Squeezy error:', JSON.stringify(error, null, 2));
            return NextResponse.json({ error: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : 'Checkout creation failed' }, { status: 500 });
        }

        const checkoutUrl = checkout?.data?.attributes?.url;
        console.log('[LS Checkout] Checkout URL:', checkoutUrl);

        if (!checkoutUrl) {
            console.error('[LS Checkout] No URL in checkout response. Full checkout:', JSON.stringify(checkout, null, 2));
            return NextResponse.json({ error: 'No checkout URL received' }, { status: 500 });
        }

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
