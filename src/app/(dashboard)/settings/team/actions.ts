'use server'

import { createClient } from "@/lib/supabase/server";
import { getActiveTeamId } from "@/lib/team-helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface TeamMember {
    id: string;
    user_id: string;
    team_id: string;
    role: string;
    joined_at: string;
    profiles: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
    } | null;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();

    const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles(id, full_name, email, avatar_url)')
        .eq('team_id', teamId)
        .order('role');

    if (error) {
        console.error('Error fetching team members:', error);
        return [];
    }

    return (data || []) as TeamMember[];
}

export async function inviteTeamMember(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();
    const email = formData.get('email') as string;
    const role = (formData.get('role') as string) || 'member';

    if (!email) {
        throw new Error('Email is required');
    }

    // Authorization: ensure the caller is owner or admin
    const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
        throw new Error('Forbidden: only admins and owners can invite members.');
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

    if (existingInvite) {
        throw new Error('This email already has a pending invitation.');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
        .from('team_invitations')
        .insert({
            team_id: teamId,
            email,
            role,
            token,
            expires_at: expiresAt.toISOString(),
        });

    if (error) {
        console.error('Error creating invitation:', error);
        throw new Error('Failed to invite team member');
    }

    revalidatePath('/settings');
    revalidatePath(`/teams/${teamId}`);
}

export async function removeTeamMember(memberId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();

    // Authorization: ensure the caller is owner or admin
    const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
        throw new Error('Forbidden: only admins and owners can remove members.');
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', memberId);

    if (error) {
        console.error('Error removing team member:', error);
        throw new Error('Failed to remove team member');
    }

    revalidatePath('/settings');
    revalidatePath(`/teams/${teamId}`);
}
