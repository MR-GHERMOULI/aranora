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

const MINIMUM_PAYOUT = 50;

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = createServiceClient();

        // Get affiliate
        const { data: affiliate } = await serviceClient
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!affiliate) {
            return NextResponse.json({ error: 'Active affiliate account not found' }, { status: 404 });
        }

        // Calculate available balance
        const { data: commissions } = await serviceClient
            .from('affiliate_commissions')
            .select('commission_amount')
            .eq('affiliate_id', affiliate.id)
            .in('status', ['pending', 'approved']);

        const totalPending = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

        // Subtract pending/processing payouts
        const { data: pendingPayouts } = await serviceClient
            .from('affiliate_payouts')
            .select('amount')
            .eq('affiliate_id', affiliate.id)
            .in('status', ['requested', 'processing']);

        const pendingPayoutTotal = pendingPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const availableBalance = totalPending - pendingPayoutTotal;

        if (availableBalance < MINIMUM_PAYOUT) {
            return NextResponse.json(
                { error: `Minimum payout is $${MINIMUM_PAYOUT}. Your available balance is $${availableBalance.toFixed(2)}.` },
                { status: 400 }
            );
        }

        // Create payout request
        const { data: payout, error } = await serviceClient
            .from('affiliate_payouts')
            .insert({
                affiliate_id: affiliate.id,
                amount: Number(availableBalance.toFixed(2)),
                payment_method: affiliate.payment_method,
                payment_details: affiliate.payment_details,
                status: 'requested',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ payout });
    } catch (error) {
        console.error('Payout request error:', error);
        return NextResponse.json(
            { error: 'Failed to create payout request' },
            { status: 500 }
        );
    }
}
