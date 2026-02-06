'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Contract } from "@/types";

export async function getContracts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('contracts')
        .select('*, client:clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error);
        return [];
    }

    return data as Contract[];
}

export async function getContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('contracts')
        .select('*, client:clients(*), project:projects(title)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching contract:', error);
        return null;
    }

    return data as Contract;
}

export async function createContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string || null;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contracts')
        .insert({
            user_id: user.id,
            client_id: clientId,
            project_id: projectId,
            title,
            content,
            status: 'Draft'
        });

    if (error) {
        console.error('Error creating contract:', error);
        throw new Error('Failed to create contract');
    }

    revalidatePath('/dashboard/contracts');
}

export async function signContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // verification even though typically client signs
    // In a real app, this would be a public route with a token, but for MVP we simulate "Freelancer countersigning" or marking as signed.

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('contracts')
        .update({
            status: 'Signed',
            signed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error signing contract:', error);
        throw new Error('Failed to sign contract');
    }

    revalidatePath(`/dashboard/contracts/${id}`);
}

export async function updateContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const id = formData.get('id') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string || null;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contracts')
        .update({
            client_id: clientId,
            project_id: projectId,
            title,
            content
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating contract:', error);
        throw new Error('Failed to update contract');
    }

    revalidatePath('/dashboard/contracts');
    revalidatePath(`/dashboard/contracts/${id}`);
}

export async function deleteContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting contract:', error);
        throw new Error('Failed to delete contract');
    }

    revalidatePath('/dashboard/contracts');
}
