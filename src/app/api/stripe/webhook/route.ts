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
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as unknown as Record<string, unknown>;
                const subscriptionId = invoice.subscription as string;

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
