'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PendingInvitation = {
    id: string;
    created_at: string;
    payload: {
        projectId: string;
        projectName: string;
        projectSlug?: string;
        inviterName: string;
        inviterUsername?: string;
        collaboratorId: string;
        role?: string;
    };
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'invite')
        .eq('read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invitations:', error);
        return [];
    }

    return (data || []) as PendingInvitation[];
}

export async function acceptInvitation(notificationId: string, collaboratorId: string, projectSlug?: string, projectId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_email')
        .eq('id', user.id)
        .single();

    if (!profile?.company_email) throw new Error('Profile not found');

    const { data: collRecord } = await supabase
        .from('project_collaborators')
        .select('id, collaborator_email, project_id')
        .eq('id', collaboratorId)
        .single();

    if (!collRecord || collRecord.collaborator_email !== profile.company_email) {
        throw new Error('This invitation does not belong to you');
    }

    const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({ status: 'active' })
        .eq('id', collaboratorId);

    if (updateError) throw new Error('Failed to accept invitation');

    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    revalidatePath('/invitations');
    revalidatePath('/dashboard');
    revalidatePath('/projects');

    const path = projectSlug || projectId || collRecord.project_id;
    redirect(`/projects/${path}`);
}

export async function declineInvitation(notificationId: string, collaboratorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_email')
        .eq('id', user.id)
        .single();

    if (!profile?.company_email) throw new Error('Profile not found');

    const { data: collRecord } = await supabase
        .from('project_collaborators')
        .select('id, collaborator_email')
        .eq('id', collaboratorId)
        .single();

    if (!collRecord || collRecord.collaborator_email !== profile.company_email) {
        throw new Error('This invitation does not belong to you');
    }

    const { error } = await supabase
        .from('project_collaborators')
        .update({ status: 'declined' })
        .eq('id', collaboratorId);

    if (error) throw new Error('Failed to decline invitation');

    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    revalidatePath('/invitations');
    revalidatePath('/dashboard');
}
