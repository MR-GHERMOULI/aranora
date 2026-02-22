'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Project } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0621-\u064A-]/g, '') // Keep alphanumeric, space, and Arabic
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

export async function getProjects(clientId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let query = supabase
    .from('projects')
    .select('*, client:clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Fetch task counts per project
  const { data: tasks } = await supabase
    .from('tasks')
    .select('project_id, status')
    .eq('user_id', user.id);

  const taskCounts: Record<string, { total: number; completed: number }> = {};
  tasks?.forEach(task => {
    if (task.project_id) {
      if (!taskCounts[task.project_id]) taskCounts[task.project_id] = { total: 0, completed: 0 };
      taskCounts[task.project_id].total++;
      if (task.status === 'Done') taskCounts[task.project_id].completed++;
    }
  });

  return (data || []).map(project => ({
    ...project,
    task_count: taskCounts[project.id]?.total || 0,
    completed_task_count: taskCounts[project.id]?.completed || 0,
  }));
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const clientId = formData.get('clientId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;
  const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null;
  const startDate = formData.get('startDate') as string || null;
  const endDate = formData.get('endDate') as string || null;
  const hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;

  const { error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      client_id: clientId,
      title,
      slug: slugify(title),
      description,
      status,
      budget,
      start_date: startDate,
      end_date: endDate,
      hourly_rate: hourlyRate
    });

  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  revalidatePath('/projects');
}


export async function updateProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;
  const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null;
  const startDate = formData.get('startDate') as string || null;
  const endDate = formData.get('endDate') as string || null;
  const hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;

  const { error } = await supabase
    .from('projects')
    .update({
      title,
      slug: slugify(title),
      description,
      status,
      budget,
      start_date: startDate,
      end_date: endDate,
      hourly_rate: hourlyRate
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  const { data: updatedProject } = await supabase.from('projects').select('slug').eq('id', id).single();
  if (updatedProject?.slug) {
    revalidatePath(`/projects/${updatedProject.slug}`);
  }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }

  revalidatePath('/projects');
}

export async function toggleShareToken(projectId: string): Promise<{ share_token: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check current token
  const { data: project } = await supabase
    .from('projects')
    .select('share_token')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    throw new Error('Project not found');
  }

  const newToken = project.share_token ? null : crypto.randomUUID();

  const { error } = await supabase
    .from('projects')
    .update({ share_token: newToken })
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error toggling share token:', error);
    throw new Error('Failed to toggle sharing');
  }

  revalidatePath(`/projects/${projectId}`);
  return { share_token: newToken };
}

export async function getShareToken(projectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('projects')
    .select('share_token')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  return data?.share_token || null;
}
