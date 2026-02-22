'use server'

import { getActiveTeamId, getTeamMembers as fetchTeamMembers } from '@/lib/team-helpers'

/**
 * Get the members of the currently active workspace.
 * Used by client components that need to display team member lists 
 * (e.g., task assignment picker).
 */
export async function getActiveTeamMembers() {
    const teamId = await getActiveTeamId()
    return fetchTeamMembers(teamId)
}
