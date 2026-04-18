'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Project } from "@/types";

export async function getProject(identifier: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    // Don't filter by user_id here — RLS policies on `projects` already
    // enforce visibility (owner OR active collaborator OR share token).
    // Filtering by user_id would block collaborators from seeing their projects.
    let query = supabase
        .from('projects')
        .select('*, client:clients(name, email)');

    if (isUUID) {
        query = query.eq('id', identifier);
    } else {
        query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data as Project;
}
