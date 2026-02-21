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

    // Accept invite
    await supabase.from('project_collaborators')
        .update({ status: 'active' })
        .eq('id', collaboratorId);

    // Mark notification as read
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    revalidatePath('/dashboard');
}

export async function declineNotificationInvite(notificationId: string, collaboratorId: string) {
    const supabase = await createClient();

    // Decline invite
    await supabase.from('project_collaborators')
        .update({ status: 'declined' })
        .eq('id', collaboratorId);

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
