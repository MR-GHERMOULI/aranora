'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getInviteDetails(token: string) {
    if (!token || token.length < 10) return null;

    const adminSupabase = createAdminClient();

    const { data: member, error } = await adminSupabase
        .from('team_members')
        .select('id, team_id, role, status, invite_token, teams(name, owner_id)')
        .eq('invite_token', token)
        .single();

    if (error || !member) return null;

    const team = member.teams as any;
    if (!team) return null;

    // Only show invite page for pending invites
    if (member.status !== 'invited') {
        return {
            memberId: member.id,
            teamId: member.team_id,
            teamName: team.name,
            role: member.role,
            status: member.status,
            ownerName: '',
            ownerAvatar: null,
        };
    }

    // Get owner profile
    const { data: ownerProfile } = await adminSupabase
        .from('profiles')
        .select('full_name, company_name, avatar_url')
        .eq('id', team.owner_id)
        .single();

    return {
        memberId: member.id,
        teamId: member.team_id,
        teamName: team.name,
        role: member.role,
        status: member.status,
        ownerName: ownerProfile?.full_name || ownerProfile?.company_name || 'A freelancer',
        ownerAvatar: ownerProfile?.avatar_url,
    };
}

export async function acceptTeamInvite(token: string) {
    if (!token || token.length < 10) {
        return { error: 'invalid_invite' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'not_authenticated', redirectTo: `/login?next=/team-invite/${token}` };
    }

    const adminSupabase = createAdminClient();

    // Find the invite by token
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('id, team_id, status, email')
        .eq('invite_token', token)
        .single();

    if (!member) {
        return { error: 'invalid_invite' };
    }

    if (member.status === 'active') {
        return { error: 'already_accepted' };
    }

    if (member.status !== 'invited') {
        return { error: 'invalid_invite' };
    }

    // Check if this user is already an active member of this team
    const { data: existingMembership } = await adminSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (existingMembership) {
        return { error: 'already_member' };
    }

    // Accept the invite: bind user, activate, consume the token
    const { error: updateError } = await adminSupabase
        .from('team_members')
        .update({
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString(),
            invite_token: null, // Consume token so it can't be reused
        })
        .eq('id', member.id);

    if (updateError) {
        console.error('Error accepting invite:', updateError);
        return { error: 'failed' };
    }

    // Update user profile to team_member account type
    await adminSupabase
        .from('profiles')
        .update({
            account_type: 'team_member',
            active_team_id: member.team_id,
        })
        .eq('id', user.id);

    revalidatePath('/');
    return { success: true };
}
