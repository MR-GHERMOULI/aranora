/**
 * Subscription Guard — Server-Side Write Protection
 * 
 * Enforces read-only mode for users whose trial has expired
 * or whose paid subscription has lapsed.
 * 
 * Usage: Add `await requireActiveSubscription()` at the top
 * of any server action that creates, updates, or deletes data.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export class SubscriptionExpiredError extends Error {
    constructor() {
        super(
            'Your subscription has expired. Please upgrade your plan to continue using this feature.'
        );
        this.name = 'SubscriptionExpiredError';
    }
}

/**
 * Checks whether the current authenticated user has an active
 * subscription (trialing or paid). Throws SubscriptionExpiredError
 * if the user's access has lapsed.
 *
 * - Admins always bypass this check.
 * - Unauthenticated requests redirect to /login.
 */
export async function requireActiveSubscription(): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, subscription_status, is_admin')
        .eq('id', user.id)
        .single();

    // Admins always have full access
    if (profile?.is_admin) {
        return;
    }

    if (!profile) {
        throw new SubscriptionExpiredError();
    }

    const status = profile.subscription_status;
    const trialEndsAt = profile.trial_ends_at;

    // Active paid subscription
    if (status === 'active') {
        return;
    }

    // Active trial period
    if (status === 'trialing' && trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        if (trialEnd > new Date()) {
            return;
        }
    }

    // Everything else: expired, canceled, past_due, or trial ended
    throw new SubscriptionExpiredError();
}
