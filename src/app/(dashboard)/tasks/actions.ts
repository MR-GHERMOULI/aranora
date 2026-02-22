'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveTeamId } from '@/lib/team-helpers';

// ── Types ──────────────────────────────────────────────
export interface TaskFilters {
    status?: string;
    priority?: string;
    projectId?: string;
    isPersonal?: boolean;
    dateRange?: { start: string; end: string };
    excludeProjectTasks?: boolean;
    search?: string;
    labels?: string[];
    sortBy?: 'due_date' | 'priority' | 'created_at' | 'title' | 'sort_order';
    sortDirection?: 'asc' | 'desc';
    assignedToMe?: boolean;
}

export interface TaskStats {
    total: number;
    completed: number;
    overdue: number;
    dueToday: number;
    inProgress: number;
    byPriority: { Low: number; Medium: number; High: number };
    byStatus: { Todo: number; 'In Progress': number; Done: number; Postponed: number };
}

// ── Helper ─────────────────────────────────────────────
async function getAuthUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Ensure profile exists (Proactive check to prevent FK errors)
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        console.log('Profile missing for user, creating one...');
        await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            created_at: new Date().toISOString(),
        });
    }

    return { supabase, user };
}

function revalidateAll(extra?: string) {
    revalidatePath('/tasks', 'page');
    revalidatePath('/tasks', 'layout');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/', 'layout');
    if (extra) revalidatePath(extra);
}

// ── GET TASKS (Team-scoped) ───────────────────────────
export async function getTasks(filters?: TaskFilters) {
    noStore();
    const { supabase, user } = await getAuthUser();
    const teamId = await getActiveTeamId();

    let query = supabase
        .from('tasks')
        .select(`
            *,
            project:projects(title),
            creator:profiles!tasks_user_id_fkey(full_name, username),
            assignee:profiles!tasks_assigned_to_fkey(full_name, username)
        `)
        .is('subtask_of', null); // Only top-level tasks by default

    if (filters?.projectId) {
        // Project-specific view: show all tasks in project
        query = query.eq('project_id', filters.projectId);
    } else {
        // Team-scoped view: show all tasks in the active workspace
        query = query.eq('team_id', teamId);
    }

    // "Assigned to me" filter
    if (filters?.assignedToMe) {
        query = query.eq('assigned_to', user.id);
    }

    // Filters
    if (filters?.excludeProjectTasks) {
        query = query.is('project_id', null);
    }
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
        query = query.eq('priority', filters.priority);
    }
    if (filters?.isPersonal !== undefined && filters.isPersonal) {
        query = query.eq('is_personal', true);
    }
    if (filters?.dateRange) {
        query = query
            .gte('due_date', filters.dateRange.start)
            .lte('due_date', filters.dateRange.end);
    }
    if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.labels && filters.labels.length > 0) {
        query = query.overlaps('labels', filters.labels);
    }

    // Sorting
    const sortBy = filters?.sortBy || 'due_date';
    const sortDir = filters?.sortDirection || 'asc';

    if (sortBy === 'priority') {
        query = query
            .order('due_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });
    } else if (sortBy === 'sort_order') {
        query = query.order('sort_order', { ascending: true });
    } else {
        query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });
        if (sortBy !== 'created_at') {
            query = query.order('created_at', { ascending: false });
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data || [];
}

// ── GET SUBTASKS ───────────────────────────────────────
export async function getSubtasks(parentId: string) {
    noStore();
    const { supabase, user } = await getAuthUser();

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('subtask_of', parentId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching subtasks:', error);
        return [];
    }
    return data || [];
}

// ── GET TASK STATS (Team-scoped) ──────────────────────
export async function getTaskStats(): Promise<TaskStats> {
    noStore();
    const { supabase, user } = await getAuthUser();
    const teamId = await getActiveTeamId();

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status, priority, due_date')
        .eq('team_id', teamId)
        .is('subtask_of', null);

    if (error || !tasks) {
        return {
            total: 0, completed: 0, overdue: 0, dueToday: 0, inProgress: 0,
            byPriority: { Low: 0, Medium: 0, High: 0 },
            byStatus: { Todo: 0, 'In Progress': 0, Done: 0, Postponed: 0 },
        };
    }

    const today = new Date().toISOString().split('T')[0];

    const stats: TaskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Done').length,
        overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done').length,
        dueToday: tasks.filter(t => t.due_date === today).length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        byPriority: {
            Low: tasks.filter(t => t.priority === 'Low').length,
            Medium: tasks.filter(t => t.priority === 'Medium').length,
            High: tasks.filter(t => t.priority === 'High').length,
        },
        byStatus: {
            Todo: tasks.filter(t => t.status === 'Todo').length,
            'In Progress': tasks.filter(t => t.status === 'In Progress').length,
            Done: tasks.filter(t => t.status === 'Done').length,
            Postponed: tasks.filter(t => t.status === 'Postponed').length,
        },
    };

    return stats;
}

// ── CREATE TASK (Team-scoped) ─────────────────────────
export async function createTask(formData: FormData, pathToRevalidate?: string) {
    const { supabase, user } = await getAuthUser();
    const teamId = await getActiveTeamId();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string || 'Todo';
    const priority = formData.get('priority') as string || 'Medium';
    const dueDate = formData.get('dueDate') as string;
    const projectId = formData.get('projectId') as string;
    const isPersonal = formData.get('isPersonal') === 'true';
    const recurrenceType = formData.get('recurrenceType') as string;
    const labelsStr = formData.get('labels') as string;
    const subtaskOf = formData.get('subtaskOf') as string;
    const estimatedHours = formData.get('estimatedHours') ? parseFloat(formData.get('estimatedHours') as string) : null;
    const assignedTo = formData.get('assignedTo') as string;
    const visibleToStr = formData.get('visibleTo') as string;

    const recurrence = recurrenceType ? { type: recurrenceType } : null;
    const labels = labelsStr ? labelsStr.split(',').filter(Boolean) : [];
    const visibleTo = visibleToStr ? visibleToStr.split(',').filter(Boolean) : [];

    const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        team_id: teamId,
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
        project_id: projectId || null,
        assigned_to: assignedTo || user.id,
        visible_to: visibleTo,
        is_personal: isPersonal,
        recurrence,
        category: isPersonal ? 'Personal' : 'Work',
        labels,
        subtask_of: subtaskOf || null,
        estimated_hours: estimatedHours,
        completed_at: status === 'Done' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        console.error('Error creating task:', error);
        return { error: error.message };
    }

    revalidateAll(pathToRevalidate);
    return { success: true };
}

// ── UPDATE TASK ────────────────────────────────────────
export async function updateTask(taskId: string, data: any, pathToRevalidate?: string) {
    const { supabase, user } = await getAuthUser();

    // Auto-set completed_at when status changes
    if (data.status === 'Done' && !data.completed_at) {
        data.completed_at = new Date().toISOString();
    } else if (data.status && data.status !== 'Done') {
        data.completed_at = null;
    }

    // Team members can update tasks they are assigned to or own
    const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        return { error: error.message };
    }

    if (!updatedTask) {
        return { error: 'Task not found or access denied' };
    }

    revalidateAll(pathToRevalidate);
    return { success: true };
}

// ── DELETE TASK ────────────────────────────────────────
export async function deleteTask(taskId: string, pathToRevalidate?: string) {
    const { supabase, user } = await getAuthUser();

    const { data: deletedTask, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error deleting task:', error);
        return { error: error.message };
    }

    if (!deletedTask) {
        return { error: 'Task not found or access denied' };
    }

    revalidateAll(pathToRevalidate);
    return { success: true };
}

// ── BULK UPDATE ────────────────────────────────────────
export async function bulkUpdateTasks(taskIds: string[], data: any) {
    const { supabase, user } = await getAuthUser();

    if (data.status === 'Done') {
        data.completed_at = new Date().toISOString();
    } else if (data.status && data.status !== 'Done') {
        data.completed_at = null;
    }

    const { error } = await supabase
        .from('tasks')
        .update(data)
        .in('id', taskIds);

    if (error) {
        console.error('Error bulk updating tasks:', error);
        return { error: error.message };
    }

    revalidateAll();
    return { success: true };
}

// ── BULK DELETE ────────────────────────────────────────
export async function bulkDeleteTasks(taskIds: string[]) {
    const { supabase, user } = await getAuthUser();

    const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);

    if (error) {
        console.error('Error bulk deleting tasks:', error);
        return { error: error.message };
    }

    revalidateAll();
    return { success: true };
}
