import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface UserBillingInfo {
    status: BillingStatus;
    trialEndsAt: string | null;
    trialDaysRemaining: number;
    isActive: boolean;
    planType: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
}

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

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const endsAt = new Date(trialEndsAt);
    const diff = endsAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function getUserBillingInfo(userId: string): Promise<UserBillingInfo> {
    const supabase = createServiceClient();

    // Get profile billing info
    const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, subscription_status, stripe_customer_id')
        .eq('id', userId)
        .single();

    // Get active billing subscription
    const { data: subscription } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const trialEndsAt = profile?.trial_ends_at || null;
    const trialDaysRemaining = getTrialDaysRemaining(trialEndsAt);
    const profileStatus = (profile?.subscription_status || 'expired') as BillingStatus;

    // Determine effective status
    let effectiveStatus: BillingStatus = profileStatus;

    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        effectiveStatus = 'active';
    } else if (profileStatus === 'trialing' && trialDaysRemaining > 0) {
        effectiveStatus = 'trialing';
    } else if (profileStatus === 'trialing' && trialDaysRemaining <= 0) {
        effectiveStatus = 'expired';
        // Update profile status to expired
        await supabase
            .from('profiles')
            .update({ subscription_status: 'expired' })
            .eq('id', userId);
    }

    const isActive = effectiveStatus === 'active' || effectiveStatus === 'trialing';

    return {
        status: effectiveStatus,
        trialEndsAt,
        trialDaysRemaining,
        isActive,
        planType: subscription?.plan_type || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
        stripeCustomerId: profile?.stripe_customer_id || null,
    };
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
    const billing = await getUserBillingInfo(userId);
    return billing.isActive;
}
