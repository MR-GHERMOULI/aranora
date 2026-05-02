/**
 * Aranora Event Tracking — Type Definitions
 * 
 * Privacy-first: We track WHAT action happened, never the content.
 * e.g. "user created a project" — NOT "user created project named X"
 */

// ── Event Categories ─────────────────────────────────────
export type EventCategory = 'critical' | 'high' | 'medium' | 'engagement' | 'passive'

// ── Event Names ──────────────────────────────────────────
export type EventName =
    // Critical Actions (Weight: 10)
    | 'project.create'
    | 'invoice.create'
    | 'client.create'
    | 'contract.create'
    // High-Value Actions (Weight: 7)
    | 'project.update'
    | 'task.create'
    | 'task.complete'
    | 'invoice.send'
    | 'invoice.update'
    | 'contract.send'
    | 'time.start'
    | 'time.stop'
    | 'time.create'
    // Medium-Value Actions (Weight: 4)
    | 'collaborator.create'
    | 'intake_form.create'
    | 'intake_form.update'
    | 'task.update'
    | 'report.view'
    | 'calendar.view'
    // Engagement Actions (Weight: 2)
    | 'dashboard.view'
    | 'settings.update'
    | 'broadcast.send'
    | 'search.perform'
    // Passive Actions (Weight: 1)
    | 'page.view'
    | 'login'

// ── Event Definition Map ─────────────────────────────────
export interface EventDefinition {
    category: EventCategory
    weight: number
    feature: string
    description: string
}

export const EVENT_DEFINITIONS: Record<EventName, EventDefinition> = {
    // Critical Actions (Weight: 10)
    'project.create':      { category: 'critical',    weight: 10, feature: 'projects',      description: 'Created a new project' },
    'invoice.create':      { category: 'critical',    weight: 10, feature: 'invoices',      description: 'Created a new invoice' },
    'client.create':       { category: 'critical',    weight: 10, feature: 'clients',       description: 'Added a new client' },
    'contract.create':     { category: 'critical',    weight: 10, feature: 'contracts',     description: 'Created a new contract' },

    // High-Value Actions (Weight: 7)
    'project.update':      { category: 'high',        weight: 7,  feature: 'projects',      description: 'Updated a project' },
    'task.create':         { category: 'high',        weight: 7,  feature: 'tasks',         description: 'Created a new task' },
    'task.complete':       { category: 'high',        weight: 7,  feature: 'tasks',         description: 'Completed a task' },
    'invoice.send':        { category: 'high',        weight: 7,  feature: 'invoices',      description: 'Sent an invoice' },
    'invoice.update':      { category: 'high',        weight: 7,  feature: 'invoices',      description: 'Updated an invoice' },
    'contract.send':       { category: 'high',        weight: 7,  feature: 'contracts',     description: 'Sent a contract' },
    'time.start':          { category: 'high',        weight: 7,  feature: 'time-tracking', description: 'Started time tracking' },
    'time.stop':           { category: 'high',        weight: 7,  feature: 'time-tracking', description: 'Stopped time tracking' },
    'time.create':         { category: 'high',        weight: 7,  feature: 'time-tracking', description: 'Created time entry' },

    // Medium-Value Actions (Weight: 4)
    'collaborator.create': { category: 'medium',      weight: 4,  feature: 'collaborators', description: 'Added a collaborator' },
    'intake_form.create':  { category: 'medium',      weight: 4,  feature: 'intake-forms',  description: 'Created an intake form' },
    'intake_form.update':  { category: 'medium',      weight: 4,  feature: 'intake-forms',  description: 'Updated an intake form' },
    'task.update':         { category: 'medium',      weight: 4,  feature: 'tasks',         description: 'Updated a task' },
    'report.view':         { category: 'medium',      weight: 4,  feature: 'reports',       description: 'Viewed reports' },
    'calendar.view':       { category: 'medium',      weight: 4,  feature: 'calendar',      description: 'Viewed calendar' },

    // Engagement Actions (Weight: 2)
    'dashboard.view':      { category: 'engagement',  weight: 2,  feature: 'dashboard',     description: 'Visited dashboard' },
    'settings.update':     { category: 'engagement',  weight: 2,  feature: 'settings',      description: 'Updated settings' },
    'broadcast.send':      { category: 'engagement',  weight: 2,  feature: 'broadcasts',    description: 'Sent a broadcast' },
    'search.perform':      { category: 'engagement',  weight: 2,  feature: 'search',        description: 'Performed a search' },

    // Passive Actions (Weight: 1)
    'page.view':           { category: 'passive',     weight: 1,  feature: 'general',       description: 'Viewed a page' },
    'login':               { category: 'passive',     weight: 1,  feature: 'auth',          description: 'Logged in' },
}

// ── All trackable features ───────────────────────────────
export const ALL_FEATURES = [
    'projects', 'invoices', 'clients', 'contracts',
    'tasks', 'time-tracking', 'collaborators', 'intake-forms',
    'reports', 'calendar', 'dashboard', 'settings',
    'broadcasts', 'search', 'general', 'auth'
] as const

export type FeatureName = typeof ALL_FEATURES[number]

// ── Health Score Thresholds ──────────────────────────────
export const HEALTH_THRESHOLDS = {
    HEALTHY: 80,      // 80-100
    MODERATE: 60,     // 60-79
    AT_RISK: 40,      // 40-59
    CRITICAL: 20,     // 20-39
    CHURNING: 0,      // 0-19
} as const

export type HealthTrend = 'improving' | 'stable' | 'declining' | 'critical'
export type HealthLevel = 'healthy' | 'moderate' | 'at_risk' | 'critical' | 'churning'

export function getHealthLevel(score: number): HealthLevel {
    if (score >= HEALTH_THRESHOLDS.HEALTHY) return 'healthy'
    if (score >= HEALTH_THRESHOLDS.MODERATE) return 'moderate'
    if (score >= HEALTH_THRESHOLDS.AT_RISK) return 'at_risk'
    if (score >= HEALTH_THRESHOLDS.CRITICAL) return 'critical'
    return 'churning'
}
