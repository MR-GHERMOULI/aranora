'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Project } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0621-\u064A-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function getProjects(clientId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
  if (!user) redirect('/login');

  const clientId = formData.get('clientId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;
  const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null;
  const startDate = formData.get('startDate') as string || null;
  const endDate = formData.get('endDate') as string || null;
  const hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;
  const collaboratorEmailsJSON = formData.get('collaboratorEmails') as string;
  const collaboratorEmails: string[] = collaboratorEmailsJSON ? JSON.parse(collaboratorEmailsJSON) : [];

  const { data: project, error } = await supabase
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
    })
    .select()
    .single();

  if (error || !project) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  // Handle collaborators
  if (collaboratorEmails.length > 0) {
    const collaboratorInserts = collaboratorEmails.map(email => ({
      project_id: project.id,
      collaborator_email: email,
      status: 'invited'
    }));

    const { error: collError } = await supabase
      .from('project_collaborators')
      .insert(collaboratorInserts);

    if (collError) {
      console.error('Error adding project collaborators:', collError);
    }
  }

  revalidatePath('/projects');
}


export async function updateProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;
  const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null;
  const startDate = formData.get('startDate') as string || null;
  const endDate = formData.get('endDate') as string || null;
  const hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;
  const collaboratorEmailsJSON = formData.get('collaboratorEmails') as string;
  const collaboratorEmails: string[] = collaboratorEmailsJSON ? JSON.parse(collaboratorEmailsJSON) : [];

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
    .eq('id', id);

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  // Handle collaborators sync
  if (collaboratorEmails && Array.isArray(collaboratorEmails)) {
    // Get existing collaborators
    const { data: existingColl } = await supabase
      .from('project_collaborators')
      .select('collaborator_email')
      .eq('project_id', id);

    const existingEmails = existingColl?.map(c => c.collaborator_email) || [];

    // Emails to add
    const toAdd = collaboratorEmails.filter(email => !existingEmails.includes(email));

    // Emails to remove
    const toRemove = existingEmails.filter(email => !collaboratorEmails.includes(email));

    if (toAdd.length > 0) {
      const inserts = toAdd.map(email => ({
        project_id: id,
        collaborator_email: email,
        status: 'invited'
      }));
      await supabase.from('project_collaborators').insert(inserts);
    }

    if (toRemove.length > 0) {
      await supabase.from('project_collaborators')
        .delete()
        .eq('project_id', id)
        .in('collaborator_email', toRemove);
    }
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
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }

  revalidatePath('/projects');
}

import { v4 as uuidv4 } from 'uuid';

export async function toggleShareToken(projectId: string): Promise<{ share_token: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('share_token')
    .eq('id', projectId)
    .single();

  if (!project) {
    throw new Error('Project not found');
  }

  const newToken = project.share_token ? null : uuidv4();

  const { error } = await supabase
    .from('projects')
    .update({ share_token: newToken })
    .eq('id', projectId);

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
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('projects')
    .select('share_token')
    .eq('id', projectId)
    .single();

  return data?.share_token || null;
}

export async function getProjectByShareToken(token: string) {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*, client:clients(name)')
    .eq('share_token', token)
    .single();

  if (projectError || !project) {
    if (projectError?.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching shared project:', projectError);
    return null;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching shared project tasks:', tasksError);
  }

  return {
    ...project,
    tasks: tasks || []
  };
}
