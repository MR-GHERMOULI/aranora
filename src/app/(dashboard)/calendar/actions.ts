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

    revalidatePath('/calendar');
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

    revalidatePath('/calendar');
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

    revalidatePath('/calendar');
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

    revalidatePath('/calendar');
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'task' | 'deadline' | 'invoice';
    status?: string;
    priority?: string;
    color: string;
    link?: string;
    description?: string;
    projectTitle?: string;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('account_type, active_team_id')
        .eq('id', user.id)
        .single();

    const isTeamMember = profile?.account_type === 'team_member' && profile?.active_team_id;

    let tasksQuery = supabase
        .from('tasks')
        .select('id, title, due_date, status, priority, description, project:projects(title)')
        .not('due_date', 'is', null);

    let projectsQuery = supabase
        .from('projects')
        .select('id, title, end_date, status, slug')
        .not('end_date', 'is', null);

    let invoicesQuery = supabase
        .from('invoices')
        .select('id, invoice_number, due_date, status, total, client:clients(name)')
        .not('due_date', 'is', null);

    if (!isTeamMember) {
        tasksQuery = tasksQuery.or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);
        projectsQuery = projectsQuery.eq('user_id', user.id);
        invoicesQuery = invoicesQuery.eq('user_id', user.id);
    }

    const promises: any[] = [tasksQuery, projectsQuery];
    if (!isTeamMember) {
        promises.push(invoicesQuery);
    }

    const results = await Promise.all(promises);
    const tasks = results[0].data as any[];
    const projects = results[1].data as any[];
    const invoices = !isTeamMember ? (results[2].data as any[]) : [];

    const events: CalendarEvent[] = [];

    tasks?.forEach((task: any) => {
        const priorityColors: Record<string, string> = {
            High: '#ef4444',
            Medium: '#f59e0b',
            Low: '#3b82f6',
        };
        events.push({
            id: `task-${task.id}`,
            title: task.title,
            date: task.due_date,
            type: 'task',
            status: task.status,
            priority: task.priority,
            color: priorityColors[task.priority] || '#6366f1',
            description: task.description,
            projectTitle: Array.isArray(task.project) ? task.project[0]?.title : (task.project as { title: string } | null)?.title,
        });
    });

    projects?.forEach((project: any) => {
        events.push({
            id: `project-${project.id}`,
            title: `📁 ${project.title} — Deadline`,
            date: project.end_date,
            type: 'deadline',
            status: project.status,
            color: '#8b5cf6',
            link: `/projects/${project.id}/${project.slug}`,
        });
    });

    invoices?.forEach((invoice: any) => {
        const clientData = invoice.client as { name: string } | { name: string }[] | null;
        const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name;

        events.push({
            id: `invoice-${invoice.id}`,
            title: `💰 ${invoice.invoice_number} — ${clientName || 'Invoice'}`,
            date: invoice.due_date,
            type: 'invoice',
            status: invoice.status,
            color: invoice.status === 'Overdue' ? '#ef4444' : '#f97316',
            link: `/invoices/${invoice.invoice_number}`,
        });
    });

    return events;
}
