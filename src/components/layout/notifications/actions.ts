'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

    return data || [];
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
