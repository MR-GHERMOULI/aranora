/**
 * Subscription Guard — Server-Side Write Protection
 * 
 * Enforces read-only mode for users whose trial has expired
 * or whose paid subscription has lapsed.
 * 
 * Bypass rules:
 *  - Owner accounts (is_admin = true) → ALWAYS have full access, lifetime, no payment.
 *  - Promo accounts ("Friends of the platform") → trialing with extended trial_ends_at
 *    (6 or 12 months). They get full access while trial is active, then must pay.
 * 
 * Usage: Add `await requireActiveSubscription()` at the top
 * of any server action that creates, updates, or deletes data.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export class SubscriptionExpiredError extends Error {
    constructor(message?: string) {
        super(
            message || 'Your subscription has expired. Please upgrade your plan to continue using this feature.'
        );
        this.name = 'SubscriptionExpiredError';
    }
}

/**
 * Checks whether the current authenticated user has an active
 * subscription (trialing or paid). Throws SubscriptionExpiredError
 * if the user's access has lapsed.
 *
 * - Owner (is_admin) accounts always bypass — lifetime access.
 * - Promo accounts have extended trial periods (6–12 months).
 * - Unauthenticated requests redirect to /login.
 */
export async function requireActiveSubscription(): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_ends_at, subscription_status, is_admin, account_type, active_team_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile in subscription guard:', error);
        throw new Error(`Profile check failed: ${error.message}`);
    }

    // ── Owner accounts: lifetime access, no restrictions ──
    if (profile?.is_admin) {
        return;
    }

    if (!profile) {
        throw new SubscriptionExpiredError('User profile not found. Please contact support.');
    }

    // ── Team members: inherit owner's subscription ──
    if (profile.account_type === 'team_member' && profile.active_team_id) {
        const { data: ownerMembership } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', profile.active_team_id)
            .eq('role', 'owner')
            .single();

        if (ownerMembership) {
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('trial_ends_at, subscription_status, is_admin')
                .eq('id', ownerMembership.user_id)
                .single();

            if (ownerProfile?.is_admin) return;

            if (ownerProfile) {
                const ownerStatus = ownerProfile.subscription_status;
                if (ownerStatus === 'active') return;
                if (ownerStatus === 'trialing' && ownerProfile.trial_ends_at) {
                    if (new Date(ownerProfile.trial_ends_at) > new Date()) return;
                }
            }
        }

        throw new SubscriptionExpiredError(
            'The workspace owner\'s subscription has expired. Please contact the team owner.'
        );
    }

    // ── Standard freelancer subscription check ──
    const status = profile.subscription_status;
    const trialEndsAt = profile.trial_ends_at;

    // Active paid subscription
    if (status === 'active') {
        return;
    }

    // Active trial period (covers both regular 30-day trials AND
    // extended promo trials of 6–12 months)
    if (status === 'trialing' && trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        if (trialEnd > new Date()) {
            return;
        }
    }

    // Everything else: expired, canceled, past_due, or trial ended
    throw new SubscriptionExpiredError();
}

