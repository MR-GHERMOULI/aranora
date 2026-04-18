'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function acceptInvite(token: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/invite/${token}`);
    }

    // 1. Find the invite by token
    const { data: invite, error } = await supabase
        .from('project_collaborators')
        .select('id, project_id, status, collaborator_email')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        console.error('Invite not found or error:', error);
        throw new Error('Invalid invitation');
    }

    if (invite.status === 'active') {
        // Already accepted — redirect to the project
        redirect(`/projects/${invite.project_id}`);
    }

    // 2. Accept it — update status and bind to the accepting user's email
    const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({
            status: 'active',
            invite_token: null, // Consume token so it can't be reused
            collaborator_email: user.email // Ensure it matches the accepting user
        })
        .eq('id', invite.id);

    if (updateError) {
        console.error('Error accepting invite:', updateError);
        throw new Error('Failed to accept invitation');
    }

    redirect(`/projects/${invite.project_id}`);
}

export async function getInviteDetails(token: string) {
    const supabase = await createClient();

    // Read the invite by token — RLS policy "Anyone can view invite by token" allows this
    const { data: invite, error } = await supabase
        .from('project_collaborators')
        .select('id, project_id, collaborator_email, revenue_share, hourly_rate, payment_type, status, invite_token')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        return { invite: null, error: error || new Error('Invite not found') };
    }

    // Fetch project details separately to avoid complex join issues
    const { data: project } = await supabase
        .from('projects')
        .select('title, description')
        .eq('id', invite.project_id)
        .single();

    // Fetch inviter info (project owner)
    let inviterName = null;
    if (project) {
        const { data: projectWithOwner } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', invite.project_id)
            .single();

        if (projectWithOwner) {
            const { data: inviterProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', projectWithOwner.user_id)
                .single();
            inviterName = inviterProfile?.full_name;
        }
    }

    return {
        invite: {
            ...invite,
            project: project || { title: 'Unknown Project', description: '' },
            inviterName
        },
        error: null
    };
}
