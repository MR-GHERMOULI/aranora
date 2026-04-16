import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = createServiceClient();

        // Get affiliate record
        const { data: affiliate, error: affError } = await serviceClient
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (affError || !affiliate) {
            return NextResponse.json({ error: 'Not registered as affiliate' }, { status: 404 });
        }

        // Get referrals without joining profiles directly (due to foreign key pointing to auth.users)
        const { data: rawReferrals, error: referralsError } = await serviceClient
            .from('affiliate_referrals')
            .select(`
                *,
                subscription:billing_subscriptions!affiliate_referrals_subscription_id_fkey(
                    plan_type,
                    status,
                    current_period_start,
                    current_period_end,
                    cancel_at_period_end
                )
            `)
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false });

        if (referralsError) {
            console.error('Failed to fetch referrals:', referralsError);
        }

        // Manually fetch and join the referred user profiles
        let referrals = rawReferrals || [];
        const userIds = referrals.map(r => r.referred_user_id).filter(Boolean);
        
        if (userIds.length > 0) {
            const { data: profiles } = await serviceClient
                .from('profiles')
                .select('id, full_name, company_email, subscription_status, trial_ends_at')
                .in('id', userIds);
            
            if (profiles) {
                referrals = referrals.map(r => ({
                    ...r,
                    referred_user: profiles.find(p => p.id === r.referred_user_id) || null
                }));
            }
        }

        // Get commissions
        const { data: commissions } = await serviceClient
            .from('affiliate_commissions')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false });

        // Get payouts
        const { data: payouts } = await serviceClient
            .from('affiliate_payouts')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('requested_at', { ascending: false });

        // Get recent clicks (last 30 days, grouped by day for chart)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentClicks } = await serviceClient
            .from('affiliate_link_clicks')
            .select('clicked_at')
            .eq('affiliate_id', affiliate.id)
            .gte('clicked_at', thirtyDaysAgo)
            .order('clicked_at', { ascending: true });

        // Build daily clicks chart data
        const clicksByDay: Record<string, number> = {};
        (recentClicks || []).forEach(click => {
            const day = new Date(click.clicked_at).toISOString().split('T')[0];
            clicksByDay[day] = (clicksByDay[day] || 0) + 1;
        });

        // Fill in all 30 days for the chart
        const clickChartData: { date: string; clicks: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            clickChartData.push({
                date: dateStr,
                clicks: clicksByDay[dateStr] || 0,
            });
        }

        // --- Calculate comprehensive funnel stats ---
        const totalClicks = affiliate.total_clicks || 0;
        const totalReferrals = referrals?.length || 0;

        // Funnel breakdown by referral status
        const totalSignedUp = referrals?.filter(r => r.status === 'signed_up').length || 0;
        const totalSubscribed = referrals?.filter(r => r.status === 'subscribed').length || 0;
        const totalChurned = referrals?.filter(r => r.status === 'churned').length || 0;
        const totalExpired = referrals?.filter(r => r.status === 'expired').length || 0;

        // Trialing: users who signed up but haven't subscribed, and their trial is still active
        const totalTrialing = referrals?.filter(r => {
            if (r.status !== 'signed_up') return false;
            const userProfile = r.referred_user;
            if (!userProfile) return false;
            if (userProfile.subscription_status === 'trialing' && userProfile.trial_ends_at) {
                return new Date(userProfile.trial_ends_at) > new Date();
            }
            return false;
        }).length || 0;

        // Active subscriptions (currently paying)
        const activeSubscriptions = referrals?.filter(r => r.status === 'subscribed').length || 0;

        // Conversion rates
        const clickToSignupRate = totalClicks > 0
            ? Number(((totalReferrals / totalClicks) * 100).toFixed(1))
            : 0;
        const signupToSubscriptionRate = totalReferrals > 0
            ? Number(((totalSubscribed / totalReferrals) * 100).toFixed(1))
            : 0;

        // Earnings
        const totalEarned = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
        const pendingEarnings = commissions
            ?.filter(c => c.status === 'pending' || c.status === 'approved')
            .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
        const paidEarnings = commissions
            ?.filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

        // Earnings this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEarnings = commissions
            ?.filter(c => new Date(c.created_at) >= startOfMonth)
            .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

        // Available for payout
        const requestedPayouts = payouts
            ?.filter(p => p.status === 'requested' || p.status === 'processing')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const availableBalance = Math.max(0, pendingEarnings - requestedPayouts);

        // --- Monthly subscribers breakdown ---
        const monthlySubscribers = referrals?.filter(r =>
            r.status === 'subscribed' && r.subscription_type === 'monthly'
        ).length || 0;
        const yearlySubscribers = referrals?.filter(r =>
            r.status === 'subscribed' && r.subscription_type === 'yearly'
        ).length || 0;

        return NextResponse.json({
            affiliate,
            stats: {
                // Funnel metrics
                totalClicks,
                totalReferrals,
                totalSignedUp,
                totalTrialing,
                totalSubscribed,
                totalChurned,
                totalExpired,
                activeSubscriptions,
                monthlySubscribers,
                yearlySubscribers,

                // Conversion rates
                clickToSignupRate,
                signupToSubscriptionRate,

                // Earnings
                totalEarned: Number(totalEarned.toFixed(2)),
                pendingEarnings: Number(pendingEarnings.toFixed(2)),
                paidEarnings: Number(paidEarnings.toFixed(2)),
                thisMonthEarnings: Number(thisMonthEarnings.toFixed(2)),
                availableBalance: Number(availableBalance.toFixed(2)),
            },
            referrals: referrals || [],
            commissions: (commissions || []).slice(0, 50),
            payouts: payouts || [],
            clickChartData,
        });
    } catch (error) {
        console.error('Affiliate dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
