'use server'

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Client } from "@/types";

export async function getClients() {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data as Client[];
}

export async function createClient(formData: FormData) {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase
        .from('clients')
        .insert({
            user_id: user.id,
            name,
            email,
            phone,
            status,
            notes
        });

    if (error) {
        console.error('Error creating client:', error);
        throw new Error('Failed to create client');
    }

    revalidatePath('/dashboard/clients');
}


export async function updateClient(formData: FormData) {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase
        .from('clients')
        .update({
            name,
            email,
            phone,
            status,
            notes
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating client:', error);
        throw new Error('Failed to update client');
    }

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${id}`);
}

export async function deleteClient(clientId: string) {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting client:', error);
        throw new Error('Failed to delete client');
    }

    revalidatePath('/dashboard/clients');
}
