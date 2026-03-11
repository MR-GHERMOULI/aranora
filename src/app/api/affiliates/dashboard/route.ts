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

        // Get referrals
        const { data: referrals } = await serviceClient
            .from('affiliate_referrals')
            .select('*, referred_user:profiles!affiliate_referrals_referred_user_id_fkey(full_name, company_email)')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false });

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

        // Calculate stats
        const totalReferrals = referrals?.length || 0;
        const activeSubscriptions = referrals?.filter(r => r.status === 'subscribed').length || 0;
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

        // Available for payout (approved but not yet paid, minus requested payouts)
        const requestedPayouts = payouts
            ?.filter(p => p.status === 'requested' || p.status === 'processing')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const availableBalance = Math.max(0, pendingEarnings - requestedPayouts);

        return NextResponse.json({
            affiliate,
            stats: {
                totalReferrals,
                activeSubscriptions,
                totalEarned: Number(totalEarned.toFixed(2)),
                pendingEarnings: Number(pendingEarnings.toFixed(2)),
                paidEarnings: Number(paidEarnings.toFixed(2)),
                thisMonthEarnings: Number(thisMonthEarnings.toFixed(2)),
                availableBalance: Number(availableBalance.toFixed(2)),
            },
            referrals: referrals || [],
            commissions: (commissions || []).slice(0, 20),
            payouts: payouts || [],
        });
    } catch (error) {
        console.error('Affiliate dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
