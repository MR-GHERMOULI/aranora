import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';

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

// Helper to extract subscription period info safely
function getSubscriptionPeriod(sub: Record<string, unknown>) {
    const start = sub.current_period_start as number | undefined;
    const end = sub.current_period_end as number | undefined;
    return {
        current_period_start: start ? new Date(start * 1000).toISOString() : null,
        current_period_end: end ? new Date(end * 1000).toISOString() : null,
        cancel_at_period_end: (sub.cancel_at_period_end as boolean) || false,
        status: sub.status as string,
        metadata: sub.metadata as Record<string, string> | undefined,
    };
}

// Helper to handle affiliate commission on a new subscription
async function handleAffiliateNewSubscription(
    supabase: ReturnType<typeof createServiceClient>,
    userId: string,
    affiliateCode: string,
    planType: string,
    invoiceAmount: number,
    invoiceStripeId: string | null,
    subscriptionId: string | null
) {
    try {
        // Find the affiliate by code
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('affiliate_code', affiliateCode)
            .eq('status', 'active')
            .single();

        if (!affiliate) return;

        // Check if referral already exists for this user
        const { data: existingRef } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .eq('affiliate_id', affiliate.id)
            .eq('referred_user_id', userId)
            .single();

        let referralId: string;

        if (existingRef) {
            referralId = existingRef.id;
            // Update the referral status
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
            // Create new referral
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

        // Calculate commission
        const commissionAmount = Number((invoiceAmount * COMMISSION_RATE).toFixed(2));

        // Create commission record
        await supabase.from('affiliate_commissions').insert({
            affiliate_id: affiliate.id,
            referral_id: referralId,
            invoice_stripe_id: invoiceStripeId,
            subscription_type: planType,
            invoice_amount: invoiceAmount,
            commission_amount: commissionAmount,
            commission_month: 1,
            status: 'pending',
        });

        // Update affiliate total_earned
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

        // Update profile to record which affiliate referred this user
        await supabase
            .from('profiles')
            .update({ referred_by_affiliate: affiliateCode })
            .eq('id', userId);

    } catch (err) {
        console.error('Affiliate commission error:', err);
    }
}

// Helper to handle recurring invoice commission
async function handleAffiliateRecurringInvoice(
    supabase: ReturnType<typeof createServiceClient>,
    userId: string,
    invoiceAmount: number,
    invoiceStripeId: string,
    planType: string
) {
    try {
        // Only monthly plans generate recurring commissions
        if (planType !== 'monthly') return;

        // Find the referral for this user
        const { data: referral } = await supabase
            .from('affiliate_referrals')
            .select('id, affiliate_id, commission_eligible_until, subscription_type')
            .eq('referred_user_id', userId)
            .eq('status', 'subscribed')
            .single();

        if (!referral) return;

        // Check if still within commission window (12 months)
        if (referral.commission_eligible_until) {
            const eligibleUntil = new Date(referral.commission_eligible_until);
            if (eligibleUntil < new Date()) return; // Expired
        }

        // Check how many commissions already exist for this referral
        const { count } = await supabase
            .from('affiliate_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('referral_id', referral.id);

        const commissionMonth = (count || 0) + 1;
        if (commissionMonth > COMMISSION_MONTHS) return; // Max 12 months

        // Skip month 1 — it was already created by checkout.session.completed
        if (commissionMonth === 1) return;

        // Check if a commission already exists for this invoice
        const { data: existingComm } = await supabase
            .from('affiliate_commissions')
            .select('id')
            .eq('invoice_stripe_id', invoiceStripeId)
            .single();

        if (existingComm) return; // Already processed

        const commissionAmount = Number((invoiceAmount * COMMISSION_RATE).toFixed(2));

        // Create commission record
        await supabase.from('affiliate_commissions').insert({
            affiliate_id: referral.affiliate_id,
            referral_id: referral.id,
            invoice_stripe_id: invoiceStripeId,
            subscription_type: 'monthly',
            invoice_amount: invoiceAmount,
            commission_amount: commissionAmount,
            commission_month: commissionMonth,
            status: 'pending',
        });

        // Update affiliate total_earned
        const { data: aff } = await supabase
            .from('affiliates')
            .select('total_earned')
            .eq('id', referral.affiliate_id)
            .single();

        await supabase
            .from('affiliates')
            .update({
                total_earned: Number(aff?.total_earned || 0) + commissionAmount,
            })
            .eq('id', referral.affiliate_id);

    } catch (err) {
        console.error('Recurring commission error:', err);
    }
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createServiceClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const planType = session.metadata?.plan_type;
                const promoCode = session.metadata?.promo_code;
                const affiliateCode = session.metadata?.affiliate_code;

                if (!userId || !planType) break;

                // Get the subscription details
                const subscriptionId = session.subscription as string;
                const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
                const sub = subResponse as unknown as Record<string, unknown>;
                const period = getSubscriptionPeriod(sub);

                // Create billing subscription record
                await supabase.from('billing_subscriptions').upsert({
                    user_id: userId,
                    stripe_subscription_id: subscriptionId,
                    stripe_customer_id: session.customer as string,
                    plan_type: planType,
                    status: period.status === 'trialing' ? 'trialing' : 'active',
                    current_period_start: period.current_period_start,
                    current_period_end: period.current_period_end,
                    cancel_at_period_end: period.cancel_at_period_end,
                    promo_code: promoCode || null,
                }, { onConflict: 'stripe_subscription_id' });

                // Update profile status
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        stripe_customer_id: session.customer as string,
                    })
                    .eq('id', userId);

                // If promo code was used, mark it
                if (promoCode) {
                    await supabase
                        .from('promo_invite_links')
                        .update({
                            times_used: 1,
                            used_by: userId,
                            is_active: false,
                        })
                        .eq('code', promoCode)
                        .eq('is_active', true);
                }

                // Handle affiliate commission on initial checkout
                if (affiliateCode) {
                    const invoiceAmount = planType === 'yearly' ? 190 : 19;
                    await handleAffiliateNewSubscription(
                        supabase,
                        userId,
                        affiliateCode,
                        planType,
                        invoiceAmount,
                        null,
                        subscriptionId
                    );
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as unknown as Record<string, unknown>;
                const subscriptionId = invoice.subscription as string;
                const invoiceId = invoice.id as string;
                const amountPaid = Number(invoice.amount_paid || 0) / 100; // Convert from cents

                if (subscriptionId) {
                    const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
                    const sub = subResponse as unknown as Record<string, unknown>;
                    const period = getSubscriptionPeriod(sub);

                    await supabase
                        .from('billing_subscriptions')
                        .update({
                            status: 'active',
                            current_period_start: period.current_period_start,
                            current_period_end: period.current_period_end,
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    // Update profile status
                    const userId = period.metadata?.supabase_user_id;
                    if (userId) {
                        await supabase
                            .from('profiles')
                            .update({ subscription_status: 'active' })
                            .eq('id', userId);

                        // Handle affiliate recurring commission for monthly invoices
                        const planType = period.metadata?.plan_type || 'monthly';
                        if (amountPaid > 0) {
                            await handleAffiliateRecurringInvoice(
                                supabase,
                                userId,
                                amountPaid,
                                invoiceId,
                                planType
                            );
                        }
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as unknown as Record<string, unknown>;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    await supabase
                        .from('billing_subscriptions')
                        .update({ status: 'past_due' })
                        .eq('stripe_subscription_id', subscriptionId);

                    const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
                    const sub = subResponse as unknown as Record<string, unknown>;
                    const period = getSubscriptionPeriod(sub);
                    const userId = period.metadata?.supabase_user_id;
                    if (userId) {
                        await supabase
                            .from('profiles')
                            .update({ subscription_status: 'past_due' })
                            .eq('id', userId);
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const sub = subscription as unknown as Record<string, unknown>;
                const period = getSubscriptionPeriod(sub);
                const userId = period.metadata?.supabase_user_id;

                await supabase
                    .from('billing_subscriptions')
                    .update({
                        status: period.status === 'active' ? 'active' : period.status === 'past_due' ? 'past_due' : period.status,
                        cancel_at_period_end: period.cancel_at_period_end,
                        current_period_start: period.current_period_start,
                        current_period_end: period.current_period_end,
                    })
                    .eq('stripe_subscription_id', (sub.id as string));

                if (userId) {
                    const statusMap: Record<string, string> = {
                        active: 'active',
                        past_due: 'past_due',
                        canceled: 'canceled',
                        unpaid: 'past_due',
                    };
                    const newStatus = statusMap[period.status] || 'active';
                    await supabase
                        .from('profiles')
                        .update({ subscription_status: newStatus })
                        .eq('id', userId);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const sub = subscription as unknown as Record<string, unknown>;
                const period = getSubscriptionPeriod(sub);
                const userId = period.metadata?.supabase_user_id;

                await supabase
                    .from('billing_subscriptions')
                    .update({ status: 'expired' })
                    .eq('stripe_subscription_id', (sub.id as string));

                if (userId) {
                    await supabase
                        .from('profiles')
                        .update({ subscription_status: 'expired' })
                        .eq('id', userId);

                    // Mark affiliate referral as churned
                    await supabase
                        .from('affiliate_referrals')
                        .update({ status: 'churned' })
                        .eq('referred_user_id', userId)
                        .eq('status', 'subscribed');
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
