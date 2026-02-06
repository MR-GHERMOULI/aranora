'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Try multiple possible table names for profile if standard 'profiles' fails? 
    // Standard supabase starter usually uses 'profiles' with id = user.id
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // If no profile found but user exists, might return null or error. 
    // We'll handle null by returning a default object based on auth metadata if possible, or just empty.

    if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) results returned
        console.error('Error fetching profile:', error);
    }

    return {
        id: user.id,
        username: data?.username || '',
        full_name: data?.full_name || '',
        company_name: data?.company_name || '',
        company_email: data?.company_email || user.email || '',
        address: data?.address || '',
        currency: data?.currency || 'USD'
    };
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const username = (formData.get('username') as string)?.toLowerCase().trim();
    const full_name = formData.get('fullName') as string;
    const company_name = formData.get('companyName') as string;
    const company_email = formData.get('companyEmail') as string;
    const address = formData.get('address') as string;

    // Basic username validation
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        throw new Error('Username must be 3-20 characters and only contain letters, numbers, and underscores.');
    }

    // Check if username is already taken by another user
    if (username) {
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', user.id)
            .single();

        if (existingUser) {
            throw new Error('Username is already taken.');
        }
    }

    const updates = {
        id: user.id,
        username,
        full_name,
        company_name,
        company_email,
        address,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('profiles')
        .upsert(updates);

    if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }

    revalidatePath('/dashboard/settings');
}
