'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getInviteDetails(token: string) {
    const adminSupabase = createAdminClient();

    const { data: member, error } = await adminSupabase
        .from('team_members')
        .select('id, team_id, role, status, invite_token, teams(name, owner_id)')
        .eq('invite_token', token)
        .single();

    if (error || !member) return null;

    const team = member.teams as any;
    if (!team) return null;

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'not_authenticated', redirectTo: `/login?next=/team-invite/${token}` };
    }

    const adminSupabase = createAdminClient();

    // Find the invite
    const { data: member } = await adminSupabase
        .from('team_members')
        .select('id, team_id, status')
        .eq('invite_token', token)
        .single();

    if (!member) {
        return { error: 'invalid_invite' };
    }

    if (member.status === 'active') {
        return { error: 'already_accepted' };
    }

    // Accept the invite
    const { error: updateError } = await adminSupabase
        .from('team_members')
        .update({
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString(),
        })
        .eq('id', member.id);

    if (updateError) {
        console.error('Error accepting invite:', updateError);
        return { error: 'failed' };
    }

    // Update user profile
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
