/**
 * Aranora Event Tracker — Server-side event logging
 * 
 * Usage: Add `trackEvent(userId, 'project.create')` in any server action.
 * This is fire-and-forget — it never blocks the main action.
 * Privacy-first: no user content is ever stored.
 */

import { EventName, EVENT_DEFINITIONS } from './event-types'

/**
 * Tracks a user event in the database.
 * 
 * This function is designed to be non-blocking and failure-safe:
 * - Uses fire-and-forget pattern (no await needed in caller)
 * - Silently catches all errors to never disrupt the main flow
 * - Updates `profiles.last_active_at` alongside the event
 * 
 * @param userId - The authenticated user's ID
 * @param eventName - One of the predefined event names (e.g., 'project.create')
 * @param metadata - Optional privacy-safe metadata (e.g., { feature: 'projects' })
 */
export async function trackEvent(
    userId: string,
    eventName: EventName,
    metadata?: Record<string, string | number | boolean>
): Promise<void> {
    try {
        const definition = EVENT_DEFINITIONS[eventName]
        if (!definition) return

        // Dynamic import to avoid circular dependencies and keep bundle small
        const { createAdminClient } = await import('@/lib/supabase/server')
        const supabase = createAdminClient()

        // Fire both queries in parallel — neither blocks the other
        await Promise.allSettled([
            // 1. Insert the event record
            supabase.from('user_events').insert({
                user_id: userId,
                event_name: eventName,
                event_category: definition.category,
                event_weight: definition.weight,
                metadata: {
                    feature: definition.feature,
                    ...metadata,
                },
            }),

            // 2. Update profile's last activity timestamp
            supabase.from('profiles').update({
                last_active_at: new Date().toISOString(),
            }).eq('id', userId),
        ])
    } catch {
        // Silently fail — tracking should never break the app
    }
}

/**
 * Fire-and-forget wrapper. Call this without await so it doesn't block.
 * 
 * Example:
 *   fireEvent(user.id, 'project.create')
 *   // continues immediately, tracking happens in background
 */
export function fireEvent(
    userId: string,
    eventName: EventName,
    metadata?: Record<string, string | number | boolean>
): void {
    // Start the async operation but don't wait for it
    trackEvent(userId, eventName, metadata).catch(() => {
        // Intentionally empty — fire and forget
    })
}
