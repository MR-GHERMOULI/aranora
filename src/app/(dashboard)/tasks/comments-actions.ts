'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveTeamId } from "@/lib/team-helpers";

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    team_id: string;
    content: string;
    activity_type: string;
    metadata: any;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();

    const { data: comments, error } = await supabase
        .from('task_comments')
        .select(`
            *,
            user:profiles!user_id(full_name, email)
        `)
        .eq('task_id', taskId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching task comments:', error);
        return [];
    }

    // Profile join returns an array or single object depending on the relationship, handle both:
    return (comments || []).map(comment => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user
    })) as TaskComment[];
}

export async function addTaskComment(taskId: string, content: string, activityType: string = 'comment', metadata: any = {}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();

    const { error } = await supabase
        .from('task_comments')
        .insert({
            task_id: taskId,
            user_id: user.id,
            team_id: teamId,
            content: content,
            activity_type: activityType,
            metadata: metadata
        });

    if (error) {
        console.error('Error adding task comment:', error);
        throw new Error('Failed to add comment');
    }

    revalidatePath('/tasks');
    // If we knew the project ID, we could revalidate the project page too.
    // revalidatePath(`/projects/[slug]`, 'page');
}
