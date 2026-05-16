'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscription-guard";
import { TeamMember, TeamMemberProject, TeamRole } from "@/types";
import { randomBytes } from 'crypto';

const MAX_TEAM_MEMBERS = 5;

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════

/**
 * Generate a cryptographically secure, short invite token.
 * Produces a 16-character URL-safe string (96 bits of entropy).
 * Example output: "xK4mN9pL2qR7wT8s"
 */
function generateSecureToken(): string {
    return randomBytes(12).toString('base64url');
}

/**
 * Validate email format to prevent filter injection in PostgREST queries.
 */
function isValidEmail(email: string): boolean {
    return /^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email) && email.length <= 254;
}

/**
 * Verify the current user is the owner of a team.
 * Returns the team_id or throws.
 */
async function verifyTeamOwnership(userId: string): Promise<string> {
    const adminSupabase = createAdminClient();
    const { data: ownerMembership } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) throw new Error('You are not a team owner.');
    return ownerMembership.team_id;
}

/**
 * Verify user is authenticated, returns user object.
 */
async function requireAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    return user;
}

// ═══════════════════════════════════════════════
// GET TEAM INFO
// ═══════════════════════════════════════════════

export async function getMyTeam() {
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Find the team where the current user is the owner
    const { data: ownerMembership } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return null;

    const { data: team } = await adminSupabase
        .from('teams')
        .select('*')
        .eq('id', ownerMembership.team_id)
        .single();

    return team;
}

export async function getTeamMembers() {
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Find the team where the current user is the owner
    const { data: ownerMembership } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return [];

    // Get active and invited members (exclude owner row and suspended)
    const { data: members, error } = await adminSupabase
        .from('team_members')
        .select('*')
        .eq('team_id', ownerMembership.team_id)
        .neq('role', 'owner')
        .in('status', ['active', 'invited'])
        .order('status', { ascending: true })
        .order('joined_at', { ascending: true });

    if (error || !members) return [];

    // Enrich with profile data
    const userIds = members.filter(m => m.user_id).map(m => m.user_id);
    let profiles: any[] = [];

    if (userIds.length > 0) {
        const { data: profileData } = await adminSupabase
            .from('profiles')
            .select('id, full_name, username, email, company_email, avatar_url, account_type')
            .in('id', userIds);
        profiles = profileData || [];
    }

    return members.map(m => ({
        ...m,
        profile: profiles.find(p => p.id === m.user_id) || (m.email ? { email: m.email } : null)
    })) as TeamMember[];
}

export async function getTeamMemberCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const adminSupabase = createAdminClient();

    const { data: ownerMembership } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return 0;

    const { count } = await adminSupabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', ownerMembership.team_id)
        .neq('role', 'owner')
        .in('status', ['active', 'invited']);

    return count || 0;
}

// ═══════════════════════════════════════════════
// INVITE TEAM MEMBER
// ═══════════════════════════════════════════════

export async function inviteTeamMember(formData: FormData) {
    await requireActiveSubscription();
    const user = await requireAuth();

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const role = (formData.get('role') as string) || 'member';

    if (!email) throw new Error('Email is required');
    if (!isValidEmail(email)) throw new Error('Please enter a valid email address.');
    if (!['manager', 'member'].includes(role)) throw new Error('Invalid role. Only "manager" or "member" roles can be assigned.');

    // Prevent owner from inviting themselves
    const adminSupabase = createAdminClient();
    const { data: selfProfile } = await adminSupabase
        .from('profiles')
        .select('email, company_email')
        .eq('id', user.id)
        .single();

    if (selfProfile?.email === email || selfProfile?.company_email === email) {
        throw new Error('You cannot invite yourself to your own team.');
    }

    // Find or create the owner's team
    let { data: ownerMembership } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    let teamId = ownerMembership?.team_id;

    if (!teamId) {
        // Create a team for this owner
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', user.id)
            .single();

        const teamName = profile?.company_name || profile?.full_name
            ? `${profile?.company_name || profile?.full_name}'s Team`
            : 'My Team';

        const { data: newTeam, error: teamError } = await adminSupabase
            .from('teams')
            .insert({ name: teamName, owner_id: user.id })
            .select()
            .single();

        if (teamError || !newTeam) {
            console.error('Error creating team:', teamError);
            throw new Error('Failed to create team');
        }

        teamId = newTeam.id;

        // Add owner as a team member
        await adminSupabase.from('team_members').insert({
            team_id: teamId,
            user_id: user.id,
            role: 'owner',
            status: 'active',
            invite_token: generateSecureToken(),
        });
    }

    // Check team size limit
    const { count } = await adminSupabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .neq('role', 'owner')
        .in('status', ['active', 'invited']);

    if ((count || 0) >= MAX_TEAM_MEMBERS) {
        throw new Error(`Maximum team size reached (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS}). Remove a member before adding a new one.`);
    }

    // Check if platform user exists
    const { data: existingUser } = await adminSupabase
        .from('profiles')
        .select('id, full_name, username')
        .or(`email.eq.${email},company_email.eq.${email}`)
        .maybeSingle();

    // Check if already a team member or invited (safe query — no string interpolation for email)
    let existingQuery = adminSupabase
        .from('team_members')
        .select('id, status, invite_token')
        .eq('team_id', teamId);

    if (existingUser) {
        existingQuery = existingQuery.or(`email.eq.${email},user_id.eq.${existingUser.id}`);
    } else {
        existingQuery = existingQuery.eq('email', email);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
        if (existing.status === 'active') {
            throw new Error('This person is already an active team member.');
        }
        if (existing.status === 'invited') {
            // Return existing token for re-sharing, regenerate if missing
            let token = existing.invite_token;
            if (!token) {
                token = generateSecureToken();
                await adminSupabase
                    .from('team_members')
                    .update({ invite_token: token })
                    .eq('id', existing.id);
            }
            return {
                inviteToken: token,
                isExistingUser: !!existingUser,
                memberName: existingUser?.full_name || email,
            };
        }
        if (existing.status === 'suspended') {
            // Re-invite suspended member with a fresh secure token
            const freshToken = generateSecureToken();
            await adminSupabase
                .from('team_members')
                .update({
                    status: 'invited',
                    invited_at: new Date().toISOString(),
                    invite_token: freshToken,
                    role: role as TeamRole,
                    user_id: existingUser?.id || null,
                })
                .eq('id', existing.id);

            revalidatePath('/team');
            return {
                inviteToken: freshToken,
                isExistingUser: !!existingUser,
                memberName: existingUser?.full_name || email,
            };
        }
    }

    try {
        const newToken = generateSecureToken();

        // Create the team member record
        const { data: newMember, error: insertError } = await adminSupabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: existingUser?.id || null,
                email: email,
                role: role as TeamRole,
                status: 'invited',
                invite_token: newToken,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Database error inviting team member:', insertError);
            if (insertError.code === '23505') {
                throw new Error('An invitation for this email already exists.');
            }
            throw new Error(`Failed to invite member: ${insertError.message}`);
        }

        if (!newMember) {
            throw new Error('Failed to generate invitation: No data returned from database.');
        }

        revalidatePath('/team');

        return {
            inviteToken: newMember.invite_token,
            isExistingUser: !!existingUser,
            memberName: existingUser?.full_name || email,
        };
    } catch (error: any) {
        console.error('Action error [inviteTeamMember]:', error);
        throw new Error(error.message || 'An unexpected error occurred during invitation.');
    }
}

// ═══════════════════════════════════════════════
// MANAGE TEAM MEMBERS
// ═══════════════════════════════════════════════

export async function updateTeamMemberRole(memberId: string, newRole: TeamRole) {
    await requireActiveSubscription();
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    if (!['manager', 'member'].includes(newRole)) {
        throw new Error('Invalid role. Only "manager" or "member" can be assigned.');
    }

    // Verify member exists
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('team_id, role')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    // Cannot change owner role
    if (member.role === 'owner') throw new Error('Cannot modify the owner role.');

    // Verify caller is the team owner
    const { data: ownerCheck } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized: Only the team owner can change roles.');

    await adminSupabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

    revalidatePath('/team');
}

export async function updateTeamMemberSalary(memberId: string, salary: number, currency: string, notes?: string) {
    await requireActiveSubscription();
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Verify member exists
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('team_id')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    // Verify caller is the team owner
    const { data: ownerCheck } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized: Only the team owner can edit salaries.');

    await adminSupabase
        .from('team_members')
        .update({
            base_salary: salary,
            salary_currency: currency,
            salary_notes: notes || null,
        })
        .eq('id', memberId);

    revalidatePath('/team');
}

export async function removeTeamMember(memberId: string) {
    await requireActiveSubscription();
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Verify member exists
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('team_id, user_id, role')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    // Cannot remove the owner
    if (member.role === 'owner') throw new Error('Cannot remove the team owner.');

    // Verify caller is the team owner
    const { data: ownerCheck } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized: Only the team owner can remove members.');

    // Suspend the member (soft delete to preserve history)
    await adminSupabase
        .from('team_members')
        .update({ status: 'suspended', invite_token: null })
        .eq('id', memberId);

    // Mark all project assignments as removed
    await adminSupabase
        .from('team_member_projects')
        .update({ removed_at: new Date().toISOString() })
        .eq('team_member_id', memberId)
        .is('removed_at', null);

    // If the member has no other active teams, revert their account_type
    if (member.user_id) {
        const { count } = await adminSupabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .eq('status', 'active')
            .neq('id', memberId);

        if (!count || count === 0) {
            await adminSupabase
                .from('profiles')
                .update({ account_type: 'freelancer', active_team_id: null })
                .eq('id', member.user_id);
        }
    }

    revalidatePath('/team');
}

// ═══════════════════════════════════════════════
// PROJECT ASSIGNMENTS
// ═══════════════════════════════════════════════

export async function assignMemberToProject(memberId: string, projectId: string) {
    await requireActiveSubscription();
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Verify member exists and is active
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('team_id, status')
        .eq('id', memberId)
        .single();

    if (!member || member.status !== 'active') throw new Error('Member not found or inactive');

    // Verify caller is the team owner
    const { data: ownerCheck } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized');

    // Check if already assigned
    const { data: existing } = await adminSupabase
        .from('team_member_projects')
        .select('id, removed_at')
        .eq('team_member_id', memberId)
        .eq('project_id', projectId)
        .maybeSingle();

    if (existing && !existing.removed_at) {
        throw new Error('Member is already assigned to this project');
    }

    if (existing && existing.removed_at) {
        // Re-activate the assignment
        await adminSupabase
            .from('team_member_projects')
            .update({ removed_at: null, assigned_at: new Date().toISOString() })
            .eq('id', existing.id);
    } else {
        await adminSupabase
            .from('team_member_projects')
            .insert({
                team_member_id: memberId,
                project_id: projectId,
                assigned_by: user.id,
            });
    }

    revalidatePath('/team');
    revalidatePath(`/projects`);
}

export async function unassignMemberFromProject(memberId: string, projectId: string) {
    await requireActiveSubscription();
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    await adminSupabase
        .from('team_member_projects')
        .update({ removed_at: new Date().toISOString() })
        .eq('team_member_id', memberId)
        .eq('project_id', projectId)
        .is('removed_at', null);

    revalidatePath('/team');
    revalidatePath(`/projects`);
}

export async function getProjectTeamMembers(projectId: string) {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from('team_member_projects')
        .select('*, team_member:team_members(id, user_id, role, status)')
        .eq('project_id', projectId)
        .is('removed_at', null);

    if (error || !data) return [];

    // Enrich with profile data
    const userIds = data
        .map(d => (d.team_member as any)?.user_id)
        .filter(Boolean);

    let profiles: any[] = [];
    if (userIds.length > 0) {
        const { data: p } = await adminSupabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);
        profiles = p || [];
    }

    return data.map(d => ({
        ...d,
        profile: profiles.find(p => p.id === (d.team_member as any)?.user_id) || null
    }));
}

// ═══════════════════════════════════════════════
// WORKSPACE SWITCHING (for team members)
// ═══════════════════════════════════════════════

export async function getMyWorkspaces() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const adminSupabase = createAdminClient();

    const { data: memberships } = await adminSupabase
        .from('team_members')
        .select('team_id, role, status, teams(id, name, owner_id)')
        .eq('user_id', user.id)
        .eq('status', 'active');

    if (!memberships) return [];

    const ownerIds = memberships
        .map(m => (m.teams as any)?.owner_id)
        .filter(Boolean);

    let ownerProfiles: any[] = [];
    if (ownerIds.length > 0) {
        const { data: p } = await adminSupabase
            .from('profiles')
            .select('id, full_name, company_name, avatar_url')
            .in('id', ownerIds);
        ownerProfiles = p || [];
    }

    return memberships.map(m => {
        const team = m.teams as any;
        const ownerProfile = ownerProfiles.find(p => p.id === team?.owner_id);
        return {
            teamId: team?.id,
            teamName: team?.name,
            role: m.role,
            ownerName: ownerProfile?.full_name || ownerProfile?.company_name || 'Unknown',
            ownerAvatar: ownerProfile?.avatar_url,
        };
    });
}

export async function switchWorkspace(teamId: string) {
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    // Verify the user is an active member of this team
    const { data: membership } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (!membership) throw new Error('You are not a member of this team');

    await adminSupabase
        .from('profiles')
        .update({ active_team_id: teamId })
        .eq('id', user.id);

    revalidatePath('/');
}

// ═══════════════════════════════════════════════
// TEAM MEMBER PERFORMANCE (Owner only)
// ═══════════════════════════════════════════════

export async function getTeamMemberStats(memberId: string) {
    const user = await requireAuth();
    const adminSupabase = createAdminClient();

    const { data: member } = await adminSupabase
        .from('team_members')
        .select('team_id, user_id')
        .eq('id', memberId)
        .single();

    if (!member) return null;

    // Verify caller is the team owner
    const { data: ownerCheck } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) return null;

    // Get assigned projects count
    const { count: projectCount } = await adminSupabase
        .from('team_member_projects')
        .select('id', { count: 'exact', head: true })
        .eq('team_member_id', memberId)
        .is('removed_at', null);

    // Get completed tasks this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let completedTasks = 0;
    let totalHours = 0;

    if (member.user_id) {
        const supabase = await createClient();

        const { count: taskCount } = await supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', member.user_id)
            .eq('status', 'Done')
            .gte('created_at', startOfMonth.toISOString());

        completedTasks = taskCount || 0;

        // Get time entries this month
        const { data: timeEntries } = await supabase
            .from('time_entries')
            .select('start_time, end_time')
            .eq('user_id', member.user_id)
            .gte('start_time', startOfMonth.toISOString())
            .not('end_time', 'is', null);

        totalHours = (timeEntries || []).reduce((sum, entry) => {
            if (!entry.end_time) return sum;
            return sum + (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
        }, 0);
    }

    return {
        activeProjects: projectCount || 0,
        completedTasksThisMonth: completedTasks,
        totalHoursThisMonth: Math.round(totalHours * 10) / 10,
    };
}
