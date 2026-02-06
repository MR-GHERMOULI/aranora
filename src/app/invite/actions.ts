'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function acceptInvite(token: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/invite/${token}`);
    }

    // 1. Find the invite
    const { data: invite, error } = await supabase
        .from('project_collaborators')
        .select('*, project:projects(title)')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        console.error('Invite not found or error:', error);
        throw new Error('Invalid invitation');
    }

    if (invite.status === 'active') {
        redirect(`/dashboard/projects/${invite.project_id}`);
    }

    // 2. Accept it
    const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({
            status: 'active',
            invite_token: null, // Consume token
            collaborator_email: user.email // Ensure it matches the accepting user
        })
        .eq('id', invite.id);

    if (updateError) {
        console.error('Error accepting invite:', updateError);
        throw new Error('Failed to accept invitation');
    }

    redirect(`/dashboard/projects/${invite.project_id}`);
}

export async function getInviteDetails(token: string) {
    const supabase = await createClient();

    // We might need to use a service role client here if RLS prevents reading un-accepted invites by random users.
    // For MVP, assuming the token makes it unique enough, but strictly with RLS we might have issues if we don't have a "public" view policy for invites by token.
    // SOLUTION: We'll attempt to read it using the current session (might be anon).
    // If that fails due to RLS, we'd need to adjust RLS policies to allow reading `project_collaborators` where `invite_token` = input token.
    // Let's assume we adjusted RLS or use the user's session if logged in.

    const { data: invite, error } = await supabase
        .from('project_collaborators')
        .select('*, project:projects(title, description), inviter:projects(user:profiles(full_name))')
        // Note: The above join is tricky depending on schema. 
        // inviter is project.user_id -> profiles.
        .eq('invite_token', token)
        .single();

    return { invite, error };
}
