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

        console.log('[LS Checkout] Attempting checkout for:', {
            userId: user.id,
            email: user.email,
            planType,
            storeId: LEMONSQUEEZY_STORE_ID,
            variantId: variantId
        });

        if (!variantId) {
            console.error('[LS Checkout] Variant ID missing for plan:', planType);
            return NextResponse.json({ error: `Plan variant '${planType}' not configured in environment variables.` }, { status: 500 });
        }

        if (!LEMONSQUEEZY_STORE_ID) {
            console.error('[LS Checkout] Store ID missing');
            return NextResponse.json({ error: 'Lemon Squeezy Store ID not configured in environment variables.' }, { status: 500 });
        }

        // Get profile for full name and email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('[LS Checkout] Profile fetch error (non-fatal):', profileError);
        }

        // Create Lemon Squeezy Checkout
        // Note: Ensure IDs are strings as expected by the newer SDK versions, 
        // but cast to any if necessary to handle internal validation.
        const checkoutResult = await createCheckout(
            LEMONSQUEEZY_STORE_ID.toString(),
            variantId.toString(),
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

        const { data: checkout, error: lsError } = checkoutResult;

        if (lsError) {
            console.error('[LS Checkout] Lemon Squeezy SDK Error:', {
                message: lsError.message,
                cause: lsError.cause,
            });
            
            // Map specific LS errors to user-friendly messages if needed
            let userMessage = lsError.message || 'Lemon Squeezy checkout creation failed';
            if (userMessage.includes('Unprocessable Entity')) {
                userMessage = 'We could not process the checkout request. Please ensure your profile details (name/email) are complete in your account settings.';
            }

            return NextResponse.json({ 
                error: userMessage,
                details: process.env.NODE_ENV === 'development' ? lsError : undefined
            }, { status: 500 });
        }

        const checkoutUrl = checkout?.data?.attributes?.url;

        if (!checkoutUrl) {
            console.error('[LS Checkout] No URL in checkout response. Full response:', JSON.stringify(checkout, null, 2));
            return NextResponse.json({ error: 'Checkout session created but no URL was returned. Please contact support.' }, { status: 500 });
        }

        console.log('[LS Checkout] Success! URL:', checkoutUrl);
        return NextResponse.json({ url: checkoutUrl });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred while creating your checkout session.' },
            { status: 500 }
        );
    }
}
