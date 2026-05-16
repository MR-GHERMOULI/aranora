'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscription-guard";
import { TeamMember, TeamMemberProject, TeamRole } from "@/types";

const MAX_TEAM_MEMBERS = 5;

// ═══════════════════════════════════════════════
// GET TEAM INFO
// ═══════════════════════════════════════════════

export async function getMyTeam() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Find the team where the current user is the owner
    const { data: ownerMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return null;

    const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', ownerMembership.team_id)
        .single();

    return team;
}

export async function getTeamMembers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Find the team where the current user is the owner
    const { data: ownerMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return [];

    const adminSupabase = createAdminClient();

    // Get all members of this team
    const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', ownerMembership.team_id)
        .neq('role', 'owner')
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
    })) as any;
}

export async function getTeamMemberCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: ownerMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerMembership) return 0;

    const { count } = await supabase
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const role = (formData.get('role') as string) || 'member';

    if (!email) throw new Error('Email is required');
    if (!['manager', 'member'].includes(role)) throw new Error('Invalid role');

    // Find or create the owner's team
    let { data: ownerMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    let teamId = ownerMembership?.team_id;

    if (!teamId) {
        // Create a team for this owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', user.id)
            .single();

        const teamName = profile?.company_name || profile?.full_name
            ? `${profile?.company_name || profile?.full_name}'s Team`
            : 'My Team';

        const { data: newTeam, error: teamError } = await supabase
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
        await supabase.from('team_members').insert({
            team_id: teamId,
            user_id: user.id,
            role: 'owner',
            status: 'active'
        });
    }

    // Check team size limit
    const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .neq('role', 'owner')
        .in('status', ['active', 'invited']);

    if ((count || 0) >= MAX_TEAM_MEMBERS) {
        throw new Error(`Maximum team size reached (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS}). Remove a member before adding a new one.`);
    }

    // Check if platform user exists
    const adminSupabase = createAdminClient();
    const { data: existingUser } = await adminSupabase
        .from('profiles')
        .select('id, full_name, username')
        .or(`email.eq.${email},company_email.eq.${email}`)
        .maybeSingle();

    // Check if already a team member or invited
    const { data: existing } = await supabase
        .from('team_members')
        .select('id, status, invite_token')
        .eq('team_id', teamId)
        .or(`email.eq.${email}${existingUser ? `,user_id.eq.${existingUser.id}` : ''}`)
        .maybeSingle();

    if (existing) {
        if (existing.status === 'active') throw new Error('This person is already an active team member.');
        if (existing.status === 'invited') throw new Error('This person has already been invited.');
        if (existing.status === 'suspended') {
            // Re-invite suspended member
            await supabase
                .from('team_members')
                .update({ status: 'invited', invited_at: new Date().toISOString() })
                .eq('id', existing.id);
            
            return {
                inviteToken: existing.invite_token,
                isExistingUser: !!existingUser,
                memberName: existingUser?.full_name || email,
            };
        }
    }

    // Create the team member record
    const { data: newMember, error: insertError } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: existingUser?.id || null,
            email: email, // Save the email!
            role: role as TeamRole,
            status: 'invited',
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error inviting team member:', insertError);
        throw new Error('Failed to invite team member');
    }

    revalidatePath('/team');

    return {
        inviteToken: newMember.invite_token,
        isExistingUser: !!existingUser,
        memberName: existingUser?.full_name || email,
    };
}

// ═══════════════════════════════════════════════
// MANAGE TEAM MEMBERS
// ═══════════════════════════════════════════════

export async function updateTeamMemberRole(memberId: string, newRole: TeamRole) {
    await requireActiveSubscription();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    if (!['manager', 'member'].includes(newRole)) {
        throw new Error('Invalid role');
    }

    // Verify ownership
    const { data: member } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    const { data: ownerCheck } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized');

    await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

    revalidatePath('/team');
}

export async function updateTeamMemberSalary(memberId: string, salary: number, currency: string, notes?: string) {
    await requireActiveSubscription();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Verify ownership
    const { data: member } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    const { data: ownerCheck } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized');

    await supabase
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Verify ownership
    const { data: member } = await supabase
        .from('team_members')
        .select('team_id, user_id')
        .eq('id', memberId)
        .single();

    if (!member) throw new Error('Member not found');

    const { data: ownerCheck } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized');

    // Suspend the member (soft delete to preserve history)
    await supabase
        .from('team_members')
        .update({ status: 'suspended' })
        .eq('id', memberId);

    // Mark all project assignments as removed
    await supabase
        .from('team_member_projects')
        .update({ removed_at: new Date().toISOString() })
        .eq('team_member_id', memberId)
        .is('removed_at', null);

    // If the member has no other active teams, revert their account_type
    if (member.user_id) {
        const { count } = await supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .eq('status', 'active')
            .neq('id', memberId);

        if (!count || count === 0) {
            const adminSupabase = createAdminClient();
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Verify ownership
    const { data: member } = await supabase
        .from('team_members')
        .select('team_id, status')
        .eq('id', memberId)
        .single();

    if (!member || member.status !== 'active') throw new Error('Member not found or inactive');

    const { data: ownerCheck } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) throw new Error('Unauthorized');

    // Check if already assigned
    const { data: existing } = await supabase
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
        await supabase
            .from('team_member_projects')
            .update({ removed_at: null, assigned_at: new Date().toISOString() })
            .eq('id', existing.id);
    } else {
        await supabase
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    await supabase
        .from('team_member_projects')
        .update({ removed_at: new Date().toISOString() })
        .eq('team_member_id', memberId)
        .eq('project_id', projectId)
        .is('removed_at', null);

    revalidatePath('/team');
    revalidatePath(`/projects`);
}

export async function getProjectTeamMembers(projectId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('team_member_projects')
        .select('*, team_member:team_members(id, user_id, role, status)')
        .eq('project_id', projectId)
        .is('removed_at', null);

    if (error || !data) return [];

    // Enrich with profile data
    const adminSupabase = createAdminClient();
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

    const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id, role, status, teams(id, name, owner_id)')
        .eq('user_id', user.id)
        .eq('status', 'active');

    if (!memberships) return [];

    const adminSupabase = createAdminClient();
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Verify the user is a member of this team
    const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (!membership) throw new Error('You are not a member of this team');

    await supabase
        .from('profiles')
        .update({ active_team_id: teamId })
        .eq('id', user.id);

    revalidatePath('/');
}

// ═══════════════════════════════════════════════
// TEAM MEMBER PERFORMANCE (Owner only)
// ═══════════════════════════════════════════════

export async function getTeamMemberStats(memberId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: member } = await supabase
        .from('team_members')
        .select('team_id, user_id')
        .eq('id', memberId)
        .single();

    if (!member) return null;

    // Verify ownership
    const { data: ownerCheck } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    if (!ownerCheck) return null;

    // Get assigned projects count
    const { count: projectCount } = await supabase
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
