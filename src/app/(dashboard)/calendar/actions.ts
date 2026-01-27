'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface Task {
    id: string;
    project_id?: string;
    title: string;
    description?: string;
    status: 'Todo' | 'In Progress' | 'Done';
    due_date?: string;
    created_at: string;
    project?: { title: string };
}

export async function getTasks() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects(title)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data as Task[];
}

export async function createTask(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDate = formData.get('dueDate') as string || null;
    const projectId = formData.get('projectId') as string || null;

    const { error } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            title,
            description,
            due_date: dueDate,
            project_id: projectId,
            status: 'Todo'
        });

    if (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
    }

    revalidatePath('/dashboard/calendar');
}

export async function updateTaskStatus(taskId: string, newStatus: 'Todo' | 'In Progress' | 'Done') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating task status:', error);
        throw new Error('Failed to update task status');
    }

    revalidatePath('/dashboard/calendar');
}

export async function updateTask(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDate = formData.get('dueDate') as string || null;
    const projectId = formData.get('projectId') as string || null;

    const { error } = await supabase
        .from('tasks')
        .update({
            title,
            description,
            due_date: dueDate,
            project_id: projectId
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }

    revalidatePath('/dashboard/calendar');
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
        throw new Error('Failed to delete task');
    }

    revalidatePath('/dashboard/calendar');
}

