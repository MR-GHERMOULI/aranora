"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
});

const inviteMemberSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    name: formData.get('name') as string,
  };

  const result = createTeamSchema.safeParse(rawData);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name } = result.data;

  // 1. Create Team
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert([{ name, owner_id: userData.user.id }])
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team:', teamError);
    return { error: 'Failed to create team.' };
  }

  // 2. Add creator as owner
  const { error: memberError } = await supabase
    .from('team_members')
    .insert([{ team_id: teamData.id, user_id: userData.user.id, role: 'owner' }]);

  if (memberError) {
    console.error('Error adding owner to team:', memberError);
    // Ideally we'd rollback team creation here, but we'll return an error for now
    return { error: 'Failed to add user to the new team.' };
  }

  revalidatePath('/teams');
  return { success: true, teamId: teamData.id };
}

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    teamId: formData.get('teamId') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as string || 'member',
  };

  const result = inviteMemberSchema.safeParse(rawData);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { teamId, email, role } = result.data;

  // Check if they are already in the team
  // Actually, we should check if they already have an invitation
  const { data: existingInvite, error: inviteCheckError } = await supabase
    .from('team_invitations')
    .select('id')
    .eq('team_id', teamId)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    return { error: 'User is already invited to this team' };
  }

  // Create a unique token for the invitation
  // Note: in edge/serverless we might not have `crypto.randomBytes`, 
  // so we'll use a simple fallback or web crypto
  const token = crypto.randomUUID();

  // Set expiration (e.g., 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: insertError } = await supabase
    .from('team_invitations')
    .insert([{
      team_id: teamId,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString()
    }]);

  if (insertError) {
    console.error('Error creating invitation:', insertError);
    return { error: 'Failed to create invitation.' };
  }

  // TODO: Send Email with token link (e.g. /invitations/accept?token=123)

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function removeTeamMember(teamId: string, memberId: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { error: 'Not authenticated' };
  }

  // Authorization: verify the caller is an owner or admin of this team
  const { data: callerMembership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userData.user.id)
    .single();

  if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
    return { error: 'Forbidden: only admins and owners can remove members.' };
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) {
    console.error('Error removing team member:', error);
    return { error: 'Failed to remove member.' };
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function changeMemberRole(teamId: string, memberId: string, newRole: 'admin' | 'member') {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { error: 'Not authenticated' };
  }

  // Authorization: verify the caller is an owner or admin of this team
  const { data: callerMembership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userData.user.id)
    .single();

  if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
    return { error: 'Forbidden: only admins and owners can change member roles.' };
  }

  const { error } = await supabase
    .from('team_members')
    .update({ role: newRole })
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) {
    console.error('Error updating member role:', error);
    return { error: 'Failed to update member role.' };
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { error: 'Not authenticated. Please log in first.' };
  }

  // Find invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invitation) {
    return { error: 'Invalid or expired invitation.' };
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('team_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { error: 'Invitation has expired.' };
  }

  // Verify email matches (Optional: you might want to allow them to accept with a different email if they are logged in)
  if (invitation.email.toLowerCase() !== userData.user.email?.toLowerCase()) {
    return { error: 'This invitation was sent to a different email address.' };
  }

  // Check if user is already a member of this team
  const { data: existingMembership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', invitation.team_id)
    .eq('user_id', userData.user.id)
    .single();

  if (existingMembership) {
    // Already a member — mark invitation as accepted and redirect gracefully
    await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id);
    return { success: true, teamId: invitation.team_id };
  }

  // Add to team
  const { error: memberError } = await supabase
    .from('team_members')
    .insert([{
      team_id: invitation.team_id,
      user_id: userData.user.id,
      role: invitation.role
    }]);

  if (memberError) {
    console.error("Error adding to team:", memberError);
    return { error: 'Failed to join team.' };
  }

  // Update invitation status
  await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id);

  return { success: true, teamId: invitation.team_id };
}
