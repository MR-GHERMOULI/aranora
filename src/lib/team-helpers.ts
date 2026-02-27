'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ACTIVE_TEAM_COOKIE = 'aranora_active_team'

export async function getActiveTeamId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Since teams are removed, we return a dummy ID or null ID.
    // However, existing DB schemas might still have team_id as a required field or foreign key.
    // For now, we return 'personal' or similar to avoid breaking UI that expects a string.
    return 'personal'
}

/**
 * Set the active team ID cookie. (Deprecated)
 */
export async function setActiveTeamId(teamId: string) {
    // No-op
}

/**
 * Get all teams the current user is a member of. (Simplified)
 */
export async function getUserTeams() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    return [{
        id: 'personal',
        name: 'Personal Workspace',
        owner_id: user.id,
        created_at: new Date().toISOString(),
        role: 'owner'
    }]
}

/**
 * Get the current user's role in the active team. (Simplified)
 */
export async function getActiveTeamRole(): Promise<'owner' | 'admin' | 'member'> {
    return 'owner'
}

/**
 * Get team members for a specific team. (Simplified)
 */
export async function getTeamMembers(teamId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return [{
        id: user.id,
        user_id: user.id,
        team_id: 'personal',
        role: 'owner',
        joined_at: new Date().toISOString(),
        profiles: profile
    }]
}
