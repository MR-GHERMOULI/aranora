'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getTasks(filters?: {
    status?: string;
    projectId?: string;
    isPersonal?: boolean;
    dateRange?: { start: string; end: string };
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    let query = supabase
        .from('tasks')
        .select(`
      *,
      project:projects(title)
    `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
    }

    if (filters?.isPersonal !== undefined) {
        if (filters.isPersonal) {
            query = query.eq('is_personal', true);
        }
        // If isPersonal is false, we might still want to see all tasks or just project tasks. 
        // The user requirement implies a "Personal" list vs connected to projects.
        // logic: if explicit filter for personal=false (meaning "Project tasks"), then is_personal=false.
        // But typically we might want to see ALL tasks in a "All" view.
        // Let's stick to: if isPersonal is true => show only personal. 
        // If we want project tasks only, we'd filter by project_id is not null OR is_personal = false.
    }

    if (filters?.dateRange) {
        query = query
            .gte('due_date', filters.dateRange.start)
            .lte('due_date', filters.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data;
}

export async function createTask(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string || 'Todo';
    const priority = formData.get('priority') as string || 'Medium';
    const dueDate = formData.get('dueDate') as string; // 'YYYY-MM-DD'
    const projectId = formData.get('projectId') as string;
    const isPersonal = formData.get('isPersonal') === 'true';
    const recurrenceType = formData.get('recurrenceType') as string;

    const recurrence = recurrenceType ? { type: recurrenceType } : null;

    const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
        project_id: projectId || null,
        is_personal: isPersonal,
        recurrence,
        category: isPersonal ? 'Personal' : 'Work'
    });

    if (error) {
        console.error('Error creating task:', error);
        return { error: error.message };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateTask(taskId: string, data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating task:', error);
        return { error: error.message };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting task:', error);
        return { error: error.message };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    return { success: true };
}
