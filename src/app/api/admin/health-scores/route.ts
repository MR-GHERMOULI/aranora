import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { calculateHealthScore } from '@/lib/analytics/health-calculator'

/**
 * GET /api/admin/health-scores — Fetch all user health scores
 * POST /api/admin/health-scores — Recalculate health scores for all users
 * 
 * Admin-only endpoint (verified via is_admin check).
 */

// ── GET: Fetch health scores ─────────────────────────────
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch all profiles with health data
        const { data: profiles, error } = await adminClient
            .from('profiles')
            .select('id, full_name, company_email, username, health_score, health_trend, last_active_at, last_login_at, subscription_status, trial_ends_at, is_admin, engagement_alerts_sent, created_at')
            .order('health_score', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profiles })
    } catch (err) {
        console.error('Health scores GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ── POST: Recalculate all health scores ──────────────────
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get all non-admin users
        const { data: users } = await adminClient
            .from('profiles')
            .select('id, health_score')
            .eq('is_admin', false)

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users to process', processed: 0 })
        }

        const now = new Date()
        const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const periodStart = day30ago.toISOString().split('T')[0]
        const periodEnd = now.toISOString().split('T')[0]

        let processed = 0
        let atRiskUsers: { id: string; score: number; trend: string }[] = []

        // Process each user
        for (const u of users) {
            try {
                // Fetch events for the last 30 days
                const { data: events } = await adminClient
                    .from('user_events')
                    .select('event_name, event_category, event_weight, created_at, metadata')
                    .eq('user_id', u.id)
                    .gte('created_at', day30ago.toISOString())
                    .order('created_at', { ascending: false })

                const result = calculateHealthScore(events || [], u.health_score)

                // Update profile with new score
                await adminClient.from('profiles').update({
                    health_score: result.score,
                    health_trend: result.trend,
                }).eq('id', u.id)

                // Upsert health score snapshot
                await adminClient.from('user_health_scores').upsert({
                    user_id: u.id,
                    score: result.score,
                    score_trend: result.trend,
                    login_score: result.breakdown.loginScore,
                    core_action_score: result.breakdown.coreActionScore,
                    feature_breadth_score: result.breakdown.featureBreadth,
                    consistency_score: result.breakdown.consistencyScore,
                    events_7d: result.events7d,
                    events_30d: result.events30d,
                    last_core_action_at: result.lastCoreActionAt,
                    features_used: result.featuresUsed,
                    insights: result.insights,
                    calculated_at: now.toISOString(),
                    period_start: periodStart,
                    period_end: periodEnd,
                }, {
                    onConflict: 'user_id,period_start',
                })

                // Track at-risk users for notifications
                if (result.score < 40) {
                    atRiskUsers.push({
                        id: u.id,
                        score: result.score,
                        trend: result.trend,
                    })
                }

                processed++
            } catch (userErr) {
                console.error(`Error processing user ${u.id}:`, userErr)
            }
        }

        // Create admin notifications for at-risk users
        if (atRiskUsers.length > 0) {
            // Get the admin user IDs
            const { data: admins } = await adminClient
                .from('profiles')
                .select('id')
                .eq('is_admin', true)

            if (admins && admins.length > 0) {
                const notifications = admins.flatMap(admin =>
                    [{
                        user_id: admin.id,
                        type: 'engagement_alert',
                        payload: {
                            atRiskCount: atRiskUsers.length,
                            users: atRiskUsers.slice(0, 5), // Top 5 most at-risk
                            calculatedAt: now.toISOString(),
                        },
                    }]
                )

                await adminClient.from('notifications').insert(notifications)
            }
        }

        return NextResponse.json({
            message: 'Health scores recalculated',
            processed,
            atRiskCount: atRiskUsers.length,
        })
    } catch (err) {
        console.error('Health scores POST error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
