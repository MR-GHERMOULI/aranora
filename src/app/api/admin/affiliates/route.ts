import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { sendEmail } from '@/lib/email';

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

// GET: List all affiliates with stats
export async function GET() {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = createServiceClient();

        // Fetch all affiliates
        const { data: affiliates, error: affError } = await serviceClient
            .from('affiliates')
            .select('*')
            .order('created_at', { ascending: false });

        if (affError) throw affError;

        // Fetch all profiles to map user info
        const userIds = (affiliates || []).map(a => a.user_id).filter(Boolean);
        let profilesMap: Record<string, { full_name: string; company_email: string }> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await serviceClient
                .from('profiles')
                .select('id, full_name, company_email')
                .in('id', userIds);

            if (profiles) {
                profilesMap = Object.fromEntries(
                    profiles.map(p => [p.id, { full_name: p.full_name, company_email: p.company_email }])
                );
            }
        }

        // Fetch referral counts per affiliate
        const { data: referrals } = await serviceClient
            .from('affiliate_referrals')
            .select('affiliate_id, status');

        // Fetch commission totals per affiliate
        const { data: commissions } = await serviceClient
            .from('affiliate_commissions')
            .select('affiliate_id, commission_amount, status');

        // Fetch pending payout requests
        const { data: payouts } = await serviceClient
            .from('affiliate_payouts')
            .select('affiliate_id, amount, status');

        // Aggregate stats per affiliate
        const affiliatesWithStats = (affiliates || []).map(aff => {
            const profile = profilesMap[aff.user_id];
            const affRefs = referrals?.filter(r => r.affiliate_id === aff.id) || [];
            const affComms = commissions?.filter(c => c.affiliate_id === aff.id) || [];
            const affPayouts = payouts?.filter(p => p.affiliate_id === aff.id) || [];

            const totalReferrals = affRefs.length;
            const activeReferrals = affRefs.filter(r => r.status === 'subscribed').length;
            const totalEarned = affComms.reduce((s, c) => s + Number(c.commission_amount), 0);
            const pendingCommissions = affComms
                .filter(c => c.status === 'pending' || c.status === 'approved')
                .reduce((s, c) => s + Number(c.commission_amount), 0);
            const paidCommissions = affComms
                .filter(c => c.status === 'paid')
                .reduce((s, c) => s + Number(c.commission_amount), 0);
            const pendingPayouts = affPayouts
                .filter(p => p.status === 'requested' || p.status === 'processing')
                .reduce((s, p) => s + Number(p.amount), 0);

            return {
                ...aff,
                user_name: profile?.full_name || 'Unknown',
                user_email: profile?.company_email || '',
                totalReferrals,
                activeReferrals,
                totalEarned: Number(totalEarned.toFixed(2)),
                pendingCommissions: Number(pendingCommissions.toFixed(2)),
                paidCommissions: Number(paidCommissions.toFixed(2)),
                pendingPayouts: Number(pendingPayouts.toFixed(2)),
            };
        });

        // Global stats
        const totalPartners = affiliatesWithStats.length;
        const activePartners = affiliatesWithStats.filter(a => a.status === 'active').length;
        const pendingApprovals = affiliatesWithStats.filter(a => a.status === 'pending').length;
        const totalCommissionsPaid = affiliatesWithStats.reduce((s, a) => s + a.paidCommissions, 0);
        const totalPendingPayouts = affiliatesWithStats.reduce((s, a) => s + a.pendingPayouts, 0);
        const totalReferralsAll = affiliatesWithStats.reduce((s, a) => s + a.totalReferrals, 0);

        return NextResponse.json({
            affiliates: affiliatesWithStats,
            stats: {
                totalPartners,
                activePartners,
                pendingApprovals,
                totalCommissionsPaid: Number(totalCommissionsPaid.toFixed(2)),
                totalPendingPayouts: Number(totalPendingPayouts.toFixed(2)),
                totalReferrals: totalReferralsAll,
            },
        });
    } catch (error) {
        console.error('Error fetching admin affiliates:', error);
        return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
    }
}

// PATCH: Update affiliate status (approve/reject/suspend)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { affiliateId, action } = await request.json();

        if (!affiliateId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceClient = createServiceClient();

        const statusMap: Record<string, string> = {
            approve: 'active',
            reject: 'rejected',
            suspend: 'suspended',
            activate: 'active',
        };

        const newStatus = statusMap[action];
        if (!newStatus) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        if (action === 'approve') {
            updateData.approved_at = new Date().toISOString();
        }

        const { error } = await serviceClient
            .from('affiliates')
            .update(updateData)
            .eq('id', affiliateId);

        if (error) throw error;

        // --- Send approval email when affiliate is approved ---
        if (action === 'approve') {
            try {
                // Fetch affiliate details + their profile email
                const { data: aff } = await serviceClient
                    .from('affiliates')
                    .select('affiliate_code, company_name, user_id')
                    .eq('id', affiliateId)
                    .single();

                if (aff) {
                    const { data: profile } = await serviceClient
                        .from('profiles')
                        .select('company_email, full_name')
                        .eq('id', aff.user_id)
                        .single();

                    const affiliateEmail = profile?.company_email;
                    const affiliateName = profile?.full_name || aff.company_name;
                    const referralLink = `https://www.aranora.com/?via=${aff.affiliate_code}`;

                    if (affiliateEmail) {
                        await sendEmail({
                            to: affiliateEmail,
                            subject: '🎉 You\'re approved! Your Aranora affiliate link is ready',
                            html: `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                                    <div style="background: linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
                                        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0;">You're Approved! 🎉</h1>
                                        <p style="color: rgba(255,255,255,0.85); margin: 12px 0 0; font-size: 16px;">Welcome to the Aranora Partner Program</p>
                                    </div>

                                    <div style="padding: 36px 32px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hi <strong>${affiliateName}</strong>,</p>
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                                            Great news! Your affiliate application for <strong>${aff.company_name}</strong> has been approved.
                                            You can now start earning <strong>30% commission</strong> on every referral for up to 12 months.
                                        </p>

                                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin: 0 0 28px;">
                                            <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Your Referral Link</p>
                                            <p style="color: #4f46e5; font-size: 15px; font-family: monospace; word-break: break-all; margin: 0; font-weight: 600;">${referralLink}</p>
                                        </div>

                                        <div style="margin: 0 0 28px;">
                                            <p style="color: #374151; font-size: 15px; font-weight: 600; margin: 0 0 12px;">Quick Start Guide:</p>
                                            <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                                                <li>Share your link on social media, your website, or via email</li>
                                                <li>When someone signs up and subscribes, you earn 30% commission</li>
                                                <li>Track your earnings and referrals in your <a href="https://www.aranora.com/affiliates" style="color: #4f46e5;">affiliate dashboard</a></li>
                                                <li>Request a payout once your balance reaches $50</li>
                                            </ol>
                                        </div>

                                        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px 20px; margin: 0 0 28px;">
                                            <p style="color: #065f46; font-size: 14px; margin: 0;">
                                                💡 <strong>Pro tip:</strong> Annual plan referrals earn you <strong>$57 upfront</strong>. Monthly plan referrals earn <strong>$5.70/month × 12</strong>.
                                            </p>
                                        </div>

                                        <a href="https://www.aranora.com/affiliates" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #0ea5e9); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px;">
                                            Go to My Dashboard →
                                        </a>

                                        <p style="color: #9ca3af; font-size: 13px; margin: 28px 0 0; line-height: 1.5;">
                                            Questions? Reply to this email or contact us at <a href="mailto:support@aranora.com" style="color: #4f46e5;">support@aranora.com</a>
                                        </p>
                                    </div>
                                </div>
                            `,
                        });
                    }
                }
            } catch (emailErr) {
                // Non-critical — don't fail the approval if email fails
                console.error('[Affiliate Approval] Email notification failed:', emailErr);
            }
        }

        return NextResponse.json({ success: true, status: newStatus });
    } catch (error) {
        console.error('Error updating affiliate:', error);
        return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
    }
}

// POST: Handle payout management
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payoutId, action, adminNote } = await request.json();

        if (!payoutId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceClient = createServiceClient();

        if (action === 'complete') {
            // Mark payout as completed
            const { data: payout, error: payoutError } = await serviceClient
                .from('affiliate_payouts')
                .update({
                    status: 'completed',
                    processed_at: new Date().toISOString(),
                    admin_note: adminNote || null,
                })
                .eq('id', payoutId)
                .select()
                .single();

            if (payoutError) throw payoutError;

            // Update affiliate's total_paid
            if (payout) {
                const { data: affiliate } = await serviceClient
                    .from('affiliates')
                    .select('total_paid')
                    .eq('id', payout.affiliate_id)
                    .single();

                await serviceClient
                    .from('affiliates')
                    .update({
                        total_paid: Number(affiliate?.total_paid || 0) + Number(payout.amount),
                    })
                    .eq('id', payout.affiliate_id);

                // Mark related commissions as paid
                await serviceClient
                    .from('affiliate_commissions')
                    .update({ status: 'paid' })
                    .eq('affiliate_id', payout.affiliate_id)
                    .in('status', ['pending', 'approved']);
            }

            return NextResponse.json({ success: true });
        } else if (action === 'reject') {
            const { error } = await serviceClient
                .from('affiliate_payouts')
                .update({
                    status: 'rejected',
                    processed_at: new Date().toISOString(),
                    admin_note: adminNote || null,
                })
                .eq('id', payoutId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error managing payout:', error);
        return NextResponse.json({ error: 'Failed to manage payout' }, { status: 500 });
    }
}
