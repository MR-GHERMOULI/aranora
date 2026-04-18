'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .not('type', 'like', 'broadcast_%')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching notifications:', error);
        return [];
    }
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    revalidatePath('/dashboard');
}

export async function acceptNotificationInvite(notificationId: string, collaboratorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify this collaborator record belongs to the current user
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_email')
        .eq('id', user.id)
        .single();

    if (!profile?.company_email) {
        throw new Error('Profile not found');
    }

    // Verify the collaborator record matches the user's email
    const { data: collRecord } = await supabase
        .from('project_collaborators')
        .select('id, collaborator_email, project_id')
        .eq('id', collaboratorId)
        .single();

    if (!collRecord || collRecord.collaborator_email !== profile.company_email) {
        throw new Error('This invitation does not belong to you');
    }

    // Accept the invite — update status to active
    const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({ status: 'active' })
        .eq('id', collaboratorId);

    if (updateError) {
        console.error('Error accepting invite:', updateError);
        throw new Error('Failed to accept invitation');
    }

    // Mark notification as read
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    revalidatePath('/dashboard');
    revalidatePath('/projects');

    return { projectId: collRecord.project_id };
}

export async function declineNotificationInvite(notificationId: string, collaboratorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify this collaborator record belongs to the current user
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_email')
        .eq('id', user.id)
        .single();

    if (!profile?.company_email) {
        throw new Error('Profile not found');
    }

    const { data: collRecord } = await supabase
        .from('project_collaborators')
        .select('id, collaborator_email')
        .eq('id', collaboratorId)
        .single();

    if (!collRecord || collRecord.collaborator_email !== profile.company_email) {
        throw new Error('This invitation does not belong to you');
    }

    // Decline the invite
    const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({ status: 'declined' })
        .eq('id', collaboratorId);

    if (updateError) {
        console.error('Error declining invite:', updateError);
        throw new Error('Failed to decline invitation');
    }

    // Mark notification as read
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    revalidatePath('/dashboard');
}

export async function getPendingInvitationsCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'invite')
        .eq('read', false);

    if (error) {
        console.error('Error fetching invite count:', error);
        return 0;
    }

    return count || 0;
}

export async function getUnreadBroadcastsCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .like('type', 'broadcast_%')
        .eq('read', false);

    if (error) {
        console.error('Error fetching broadcast count:', error);
        return 0;
    }

    return count || 0;
}

export async function markBroadcastsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .like('type', 'broadcast_%')
        .eq('read', false);

    revalidatePath('/dashboard');
    revalidatePath('/broadcasts');
}
