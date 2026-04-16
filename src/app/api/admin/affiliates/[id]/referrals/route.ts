import { NextRequest, NextResponse } from 'next/server';
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

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return null;
    return user;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: affiliateId } = await params;
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = createServiceClient();

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
            .eq('affiliate_id', affiliateId)
            .order('created_at', { ascending: false });

        if (referralsError) {
            console.error('Failed to fetch referrals:', referralsError);
            return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
        }

        // Manually fetch and join the referred user profiles
        let referrals = rawReferrals || [];
        const userIds = referrals.map(r => r.referred_user_id).filter(Boolean);
        
        if (userIds.length > 0) {
            const { data: profiles } = await serviceClient
                .from('profiles')
                .select('id, full_name, company_email, phone, country, subscription_status, trial_ends_at')
                .in('id', userIds);
            
            if (profiles) {
                referrals = referrals.map(r => ({
                    ...r,
                    referred_user: profiles.find(p => p.id === r.referred_user_id) || null
                }));
            }
        }

        return NextResponse.json({ referrals });
    } catch (error) {
        console.error('Error fetching admin affiliate referrals:', error);
        return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }
}
