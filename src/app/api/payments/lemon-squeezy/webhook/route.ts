import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';

function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );
}

// Commission rate: 30%
const COMMISSION_RATE = 0.30;
// Commission duration: 12 months
const COMMISSION_MONTHS = 12;

// Helper to handle affiliate commission on a new subscription
async function handleAffiliateNewSubscription(
    supabase: any,
    userId: string,
    affiliateCode: string,
    planType: string,
    invoiceAmount: number,
    lsOrderId: string | null,
    subscriptionId: string | null
) {
    try {
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('affiliate_code', affiliateCode)
            .eq('status', 'active')
            .single();

        if (!affiliate) return;

        const { data: existingRef } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .eq('affiliate_id', affiliate.id)
            .eq('referred_user_id', userId)
            .single();

        let referralId: string;

        if (existingRef) {
            referralId = existingRef.id;
            await supabase
                .from('affiliate_referrals')
                .update({
                    status: 'subscribed',
                    subscription_type: planType,
                    converted_at: new Date().toISOString(),
                    commission_eligible_until: new Date(
                        Date.now() + COMMISSION_MONTHS * 30 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .eq('id', referralId);
        } else {
            const { data: referral, error: refError } = await supabase
                .from('affiliate_referrals')
                .insert({
                    affiliate_id: affiliate.id,
                    referred_user_id: userId,
                    subscription_id: subscriptionId || null,
                    status: 'subscribed',
                    subscription_type: planType,
                    converted_at: new Date().toISOString(),
                    commission_eligible_until: new Date(
                        Date.now() + COMMISSION_MONTHS * 30 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .select('id')
                .single();

            if (refError || !referral) return;
            referralId = referral.id;
        }

        const commissionAmount = Number((invoiceAmount * COMMISSION_RATE).toFixed(2));

        await supabase.from('affiliate_commissions').insert({
            affiliate_id: affiliate.id,
            referral_id: referralId,
            invoice_stripe_id: lsOrderId, // Reusing field for LS order ID
            subscription_type: planType,
            invoice_amount: invoiceAmount,
            commission_amount: commissionAmount,
            commission_month: 1,
            status: 'pending',
        });

        const { data: aff } = await supabase
            .from('affiliates')
            .select('total_earned')
            .eq('id', affiliate.id)
            .single();

        await supabase
            .from('affiliates')
            .update({
                total_earned: Number(aff?.total_earned || 0) + commissionAmount,
            })
            .eq('id', affiliate.id);

        await supabase
            .from('profiles')
            .update({ referred_by_affiliate: affiliateCode })
            .eq('id', userId);

    } catch (err) {
        console.error('Affiliate commission error:', err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '');
        const digest = hmac.update(rawBody).digest('hex');
        const signature = request.headers.get('x-signature');

        if (signature !== digest) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;
        const attributes = payload.data.attributes;
        const customData = payload.meta.custom_data;

        const supabase = createServiceClient();

        switch (eventName) {
            case 'order_created': {
                const userId = customData?.user_id;
                const planType = customData?.plan_type;
                const affiliateCode = customData?.affiliate_code;
                const orderId = payload.data.id;
                const customerId = attributes.customer_id;
                const total = attributes.total / 100; // LS provides cents

                if (userId) {
                    await supabase
                        .from('profiles')
                        .update({ 
                            subscription_status: 'active',
                            lemon_squeezy_customer_id: customerId.toString()
                        })
                        .eq('id', userId);
                    
                    if (affiliateCode) {
                        await handleAffiliateNewSubscription(
                            supabase,
                            userId,
                            affiliateCode,
                            planType || 'monthly',
                            total,
                            orderId.toString(),
                            null
                        );
                    }
                }
                break;
            }

            case 'subscription_created':
            case 'subscription_updated': {
                const userId = customData?.user_id;
                const subscriptionId = payload.data.id;
                const customerId = attributes.customer_id;
                const status = attributes.status; // active, trialing, past_due, cancelled, expired
                const endsAt = attributes.ends_at;
                const renwesAt = attributes.renews_at;

                if (userId) {
                    const statusMap: Record<string, string> = {
                        active: 'active',
                        trialing: 'trialing',
                        past_due: 'past_due',
                        cancelled: 'canceled',
                        expired: 'expired',
                        on_hold: 'past_due'
                    };

                    const dbStatus = statusMap[status] || 'active';

                    await supabase.from('billing_subscriptions').upsert({
                        user_id: userId,
                        lemon_squeezy_subscription_id: subscriptionId.toString(),
                        lemon_squeezy_customer_id: customerId.toString(),
                        plan_type: customData?.plan_type || 'monthly',
                        status: dbStatus,
                        current_period_start: new Date().toISOString(), // Approximation
                        current_period_end: renwesAt || endsAt,
                        cancel_at_period_end: status === 'cancelled',
                    }, { onConflict: 'lemon_squeezy_subscription_id' });

                    await supabase
                        .from('profiles')
                        .update({ subscription_status: dbStatus })
                        .eq('id', userId);
                }
                break;
            }

            case 'subscription_cancelled':
            case 'subscription_expired': {
                const subscriptionId = payload.data.id;
                
                const { data: sub } = await supabase
                    .from('billing_subscriptions')
                    .select('user_id')
                    .eq('lemon_squeezy_subscription_id', subscriptionId.toString())
                    .single();

                if (sub) {
                    await supabase
                        .from('billing_subscriptions')
                        .update({ status: 'expired' })
                        .eq('lemon_squeezy_subscription_id', subscriptionId.toString());

                    await supabase
                        .from('profiles')
                        .update({ subscription_status: 'expired' })
                        .eq('id', sub.user_id);

                    await supabase
                        .from('affiliate_referrals')
                        .update({ status: 'churned' })
                        .eq('referred_user_id', sub.user_id)
                        .eq('status', 'subscribed');
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('LS Webhook error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
