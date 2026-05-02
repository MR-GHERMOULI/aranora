import { createAdminClient } from "@/lib/supabase/server"
import { EngagementClient } from "./engagement-client"

export default async function AdminEngagementPage() {
    const supabaseAdmin = createAdminClient()

    // Fetch all profiles with health data
    const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, company_email, username, health_score, health_trend, last_active_at, last_login_at, subscription_status, trial_ends_at, is_admin, engagement_alerts_sent, created_at")
        .eq("is_admin", false)
        .order("health_score", { ascending: true })

    // Fetch event counts per user for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentEvents } = await supabaseAdmin
        .from("user_events")
        .select("user_id, event_name, event_category, created_at, metadata")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })

    // Aggregate events per user
    const userEventsMap: Record<string, {
        total: number
        events7d: number
        features: Set<string>
        lastEvent: string | null
        byCat: Record<string, number>
    }> = {}

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    recentEvents?.forEach(event => {
        if (!userEventsMap[event.user_id]) {
            userEventsMap[event.user_id] = {
                total: 0,
                events7d: 0,
                features: new Set(),
                lastEvent: null,
                byCat: {},
            }
        }
        const entry = userEventsMap[event.user_id]
        entry.total++
        if (new Date(event.created_at) >= sevenDaysAgo) entry.events7d++
        if (!entry.lastEvent) entry.lastEvent = event.created_at
        const feature = (event.metadata as any)?.feature
        if (feature) entry.features.add(feature)
        entry.byCat[event.event_category] = (entry.byCat[event.event_category] || 0) + 1
    })

    // Aggregate feature usage across all users
    const featureUsage: Record<string, number> = {}
    recentEvents?.forEach(event => {
        const feature = (event.metadata as any)?.feature
        if (feature && feature !== 'auth' && feature !== 'general') {
            featureUsage[feature] = (featureUsage[feature] || 0) + 1
        }
    })

    const featureUsageData = Object.entries(featureUsage)
        .sort((a, b) => b[1] - a[1])
        .map(([feature, count]) => ({ feature, count }))

    // Merge profiles with event data
    const enrichedProfiles = (profiles || []).map(profile => {
        const events = userEventsMap[profile.id]
        return {
            ...profile,
            events30d: events?.total || 0,
            events7d: events?.events7d || 0,
            featuresUsed: events ? Array.from(events.features) : [],
            lastEventAt: events?.lastEvent || null,
            eventsByCategory: events?.byCat || {},
        }
    })

    // Calculate summary stats
    const totalUsers = enrichedProfiles.length
    const healthyCount = enrichedProfiles.filter(u => (u.health_score || 0) >= 80).length
    const moderateCount = enrichedProfiles.filter(u => (u.health_score || 0) >= 60 && (u.health_score || 0) < 80).length
    const atRiskCount = enrichedProfiles.filter(u => (u.health_score || 0) >= 40 && (u.health_score || 0) < 60).length
    const criticalCount = enrichedProfiles.filter(u => (u.health_score || 0) >= 20 && (u.health_score || 0) < 40).length
    const churningCount = enrichedProfiles.filter(u => (u.health_score || 0) < 20).length
    const avgScore = totalUsers > 0
        ? Math.round(enrichedProfiles.reduce((sum, u) => sum + (u.health_score || 0), 0) / totalUsers)
        : 0

    const stats = {
        totalUsers,
        healthyCount,
        moderateCount,
        atRiskCount,
        criticalCount,
        churningCount,
        avgScore,
        totalEvents30d: recentEvents?.length || 0,
    }

    return (
        <EngagementClient
            profiles={enrichedProfiles}
            stats={stats}
            featureUsage={featureUsageData}
        />
    )
}
