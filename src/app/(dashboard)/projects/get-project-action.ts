'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Project } from "@/types";

export async function getProject(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(name, email)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data as Project;
}
