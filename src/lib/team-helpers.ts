'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ACTIVE_TEAM_COOKIE = 'aranora_active_team'

/**
 * Get the active team ID from cookie, with validation.
 * Falls back to the user's first team if cookie is invalid.
 */
export async function getActiveTeamId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const cookieStore = await cookies()
    const storedTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value

    if (storedTeamId) {
        // Validate the user belongs to this team
        const { data: membership } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', storedTeamId)
            .eq('user_id', user.id)
            .single()

        if (membership) return storedTeamId
    }

    // Fallback: get the user's first team (personal workspace)
    const { data: firstMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

    if (!firstMembership) {
        // User has no teams — this shouldn't happen if signup trigger works
        redirect('/login')
    }

    // Persist fallback
    try {
        cookieStore.set(ACTIVE_TEAM_COOKIE, firstMembership.team_id, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax',
        })
    } catch {
        // Server Component context — can't set cookies
    }

    return firstMembership.team_id
}

/**
 * Set the active team ID cookie.
 */
export async function setActiveTeamId(teamId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Validate membership
    const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        throw new Error('You are not a member of this team')
    }

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    })
}

/**
 * Get all teams the current user is a member of.
 */
export async function getUserTeams() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: memberships, error } = await supabase
        .from('team_members')
        .select('role, team_id, teams(id, name, owner_id, created_at)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })

    if (error) {
        console.error('Error fetching user teams:', error)
        return []
    }

    return (memberships || []).map(m => ({
        ...m.teams as any,
        role: m.role as string,
    }))
}

/**
 * Get the current user's role in the active team.
 */
export async function getActiveTeamRole(): Promise<'owner' | 'admin' | 'member'> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const teamId = await getActiveTeamId()

    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    return (membership?.role as any) || 'member'
}

/**
 * Get team members for a specific team.
 */
export async function getTeamMembers(teamId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles(id, full_name, email, avatar_url)')
        .eq('team_id', teamId)
        .order('role')

    if (error) {
        console.error('Error fetching team members:', error)
        return []
    }

    return data || []
}
