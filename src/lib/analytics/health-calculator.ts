/**
 * Aranora Health Score Calculator
 * 
 * Calculates a 0-100 Health Score for each user based on:
 * - Login frequency (20 points max)
 * - Core actions (40 points max)
 * - Feature breadth (20 points max)
 * - Consistency (20 points max)
 */

import { HealthTrend } from './event-types'

export interface HealthScoreBreakdown {
    loginScore: number        // 0-20
    coreActionScore: number   // 0-40
    featureBreadth: number    // 0-20
    consistencyScore: number  // 0-20
}

export interface HealthScoreResult {
    score: number
    trend: HealthTrend
    breakdown: HealthScoreBreakdown
    events7d: number
    events30d: number
    lastCoreActionAt: string | null
    featuresUsed: string[]
    insights: string[]
}

interface EventRow {
    event_name: string
    event_category: string
    event_weight: number
    created_at: string
    metadata: Record<string, any> | null
}

/**
 * Calculate the Health Score for a user based on their events.
 * This is a pure function — it takes events and returns a score.
 */
export function calculateHealthScore(
    events: EventRow[],
    previousScore?: number | null
): HealthScoreResult {
    const now = new Date()
    const day7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter events by time periods
    const events7d = events.filter(e => new Date(e.created_at) >= day7ago)
    const events30d = events.filter(e => new Date(e.created_at) >= day30ago)

    // ── 1. Login Score (0-20) ────────────────────────────
    const loginScore = calculateLoginScore(events30d)

    // ── 2. Core Action Score (0-40) ──────────────────────
    const coreActionScore = calculateCoreActionScore(events7d, events30d)

    // ── 3. Feature Breadth Score (0-20) ──────────────────
    const { score: featureBreadth, features: featuresUsed } = calculateFeatureBreadth(events30d)

    // ── 4. Consistency Score (0-20) ──────────────────────
    const consistencyScore = calculateConsistencyScore(events30d)

    // ── Total Score ──────────────────────────────────────
    const score = Math.min(100, Math.max(0,
        loginScore + coreActionScore + featureBreadth + consistencyScore
    ))

    // ── Trend ────────────────────────────────────────────
    const trend = calculateTrend(score, previousScore)

    // ── Last Core Action ─────────────────────────────────
    const coreEvents = events
        .filter(e => e.event_category === 'critical' || e.event_category === 'high')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const lastCoreActionAt = coreEvents[0]?.created_at || null

    // ── Insights ─────────────────────────────────────────
    const insights = generateInsights(score, {
        loginScore, coreActionScore, featureBreadth, consistencyScore
    }, events7d.length, featuresUsed)

    return {
        score,
        trend,
        breakdown: {
            loginScore,
            coreActionScore,
            featureBreadth,
            consistencyScore,
        },
        events7d: events7d.length,
        events30d: events30d.length,
        lastCoreActionAt,
        featuresUsed,
        insights,
    }
}

// ── Helper Functions ─────────────────────────────────────

function calculateLoginScore(events30d: EventRow[]): number {
    const loginEvents = events30d.filter(e => e.event_name === 'login')
    const uniqueLoginDays = new Set(
        loginEvents.map(e => new Date(e.created_at).toISOString().split('T')[0])
    ).size

    // Score based on login frequency in 30 days
    if (uniqueLoginDays >= 20) return 20   // Almost daily
    if (uniqueLoginDays >= 12) return 15   // 3-4 times/week
    if (uniqueLoginDays >= 6) return 10    // 1-2 times/week
    if (uniqueLoginDays >= 2) return 5     // Sporadic
    if (uniqueLoginDays >= 1) return 2     // Barely active
    return 0                                // No logins
}

function calculateCoreActionScore(events7d: EventRow[], events30d: EventRow[]): number {
    // Weight critical and high events more heavily
    const criticalEvents7d = events7d.filter(e => e.event_category === 'critical')
    const highEvents7d = events7d.filter(e => e.event_category === 'high')
    const criticalEvents30d = events30d.filter(e => e.event_category === 'critical')
    const highEvents30d = events30d.filter(e => e.event_category === 'high')

    let score = 0

    // Critical actions in the last 7 days (up to 20 points)
    if (criticalEvents7d.length >= 3) score += 20
    else if (criticalEvents7d.length >= 2) score += 15
    else if (criticalEvents7d.length >= 1) score += 10
    else if (criticalEvents30d.length >= 1) score += 5

    // High-value actions in the last 7 days (up to 20 points)
    if (highEvents7d.length >= 5) score += 20
    else if (highEvents7d.length >= 3) score += 15
    else if (highEvents7d.length >= 1) score += 10
    else if (highEvents30d.length >= 2) score += 5

    return Math.min(40, score)
}

function calculateFeatureBreadth(events30d: EventRow[]): { score: number; features: string[] } {
    const features = new Set<string>()

    events30d.forEach(e => {
        const feature = e.metadata?.feature
        if (feature && feature !== 'general' && feature !== 'auth') {
            features.add(feature as string)
        }
    })

    const featureCount = features.size
    let score = 0

    if (featureCount >= 8) score = 20
    else if (featureCount >= 6) score = 16
    else if (featureCount >= 4) score = 12
    else if (featureCount >= 2) score = 8
    else if (featureCount >= 1) score = 4

    return { score, features: Array.from(features) }
}

function calculateConsistencyScore(events30d: EventRow[]): number {
    // Count unique active days (days with at least one non-passive event)
    const activeDays = new Set(
        events30d
            .filter(e => e.event_category !== 'passive')
            .map(e => new Date(e.created_at).toISOString().split('T')[0])
    ).size

    if (activeDays >= 20) return 20   // Daily user
    if (activeDays >= 12) return 15   // 3-4 days/week
    if (activeDays >= 6) return 10    // 1-2 days/week
    if (activeDays >= 2) return 5     // Sporadic
    if (activeDays >= 1) return 2     // Barely
    return 0
}

function calculateTrend(currentScore: number, previousScore?: number | null): HealthTrend {
    if (previousScore === null || previousScore === undefined) return 'stable'

    const diff = currentScore - previousScore

    if (diff >= 10) return 'improving'
    if (diff <= -20) return 'critical'
    if (diff <= -5) return 'declining'
    return 'stable'
}

function generateInsights(
    score: number,
    breakdown: HealthScoreBreakdown,
    events7d: number,
    features: string[]
): string[] {
    const insights: string[] = []

    if (score >= 80) {
        insights.push('User is highly engaged and actively using the platform.')
    } else if (score >= 60) {
        insights.push('Moderate engagement — user is using the platform but could be more active.')
    } else if (score >= 40) {
        insights.push('⚠️ Usage is declining — consider reaching out to this user.')
    } else if (score >= 20) {
        insights.push('🔴 Critical low engagement — immediate attention needed.')
    } else {
        insights.push('🆘 User is essentially inactive — high churn risk.')
    }

    if (breakdown.loginScore < 5) {
        insights.push('Rarely logs in — may have forgotten about the platform.')
    }

    if (breakdown.coreActionScore < 10) {
        insights.push('Not performing core actions (creating projects, invoices, etc.).')
    }

    if (breakdown.featureBreadth < 8) {
        const unused = ['projects', 'invoices', 'tasks', 'contracts', 'time-tracking']
            .filter(f => !features.includes(f))
        if (unused.length > 0) {
            insights.push(`Not using: ${unused.join(', ')} — may need guidance.`)
        }
    }

    if (breakdown.consistencyScore < 5) {
        insights.push('Very inconsistent usage pattern.')
    }

    return insights
}
