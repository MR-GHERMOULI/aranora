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

  return data as Project[];
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
      end_date: endDate
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

  const { error } = await supabase
    .from('projects')
    .update({
      title,
      slug: slugify(title),
      description,
      status,
      budget,
      start_date: startDate,
      end_date: endDate
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
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
