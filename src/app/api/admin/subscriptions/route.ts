import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper to create a service role client to bypass RLS for admin tasks
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

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceClient();

        // 1. Fetch all profiles with their basic billing info
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, company_email, subscription_status, trial_ends_at')
            .order('created_at', { ascending: false });

        if (profilesError) {
            throw profilesError;
        }

        // 2. Fetch all detailed billing subscriptions
        const { data: subscriptions, error: subsError } = await supabase
            .from('billing_subscriptions')
            .select('*');

        if (subsError) {
            throw subsError;
        }

        // 3. Map the data together
        const mappedData = profiles.map((profile) => {
            // Find the detailed subscription record if it exists
            const sub = subscriptions.find((s) => s.user_id === profile.id);

            // Determine trial status manually just like we do for users
            const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
            const isTrialing = trialEnd ? trialEnd > new Date() : false;
            const trialDaysRemaining = trialEnd
                ? Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                : 0;

            // Determine effective status
            let effectiveStatus = profile.subscription_status || 'expired';
            if (!sub && isTrialing) {
                effectiveStatus = 'trialing'; // Default state for new users
            } else if (sub) {
                effectiveStatus = sub.status;
            }

            return {
                user_id: profile.id,
                user_name: profile.full_name || 'Unknown User',
                user_email: profile.company_email,
                status: effectiveStatus,
                plan_type: sub?.plan_type || 'None',
                trial_days_remaining: trialDaysRemaining,
                current_period_end: sub?.current_period_end || null,
                cancel_at_period_end: sub?.cancel_at_period_end || false,
                promo_code: sub?.promo_code || null,
            };
        });

        // 4. Calculate stats
        const totalUsers = mappedData.length;
        const totalActive = mappedData.filter(d => d.status === 'active').length;
        const totalTrialing = mappedData.filter(d => d.status === 'trialing').length;

        // Calculate Monthly Recurring Revenue (MRR)
        let mrr = 0;
        mappedData.filter(d => d.status === 'active').forEach(d => {
            if (d.plan_type === 'monthly') mrr += 19;
            if (d.plan_type === 'yearly') mrr += Math.round(190 / 12); // Average yearly contribution to MRR
        });

        return NextResponse.json({
            data: mappedData,
            stats: {
                totalUsers,
                totalActive,
                totalTrialing,
                mrr,
            }
        });

    } catch (error) {
        console.error('Error fetching admin subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
}
