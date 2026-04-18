'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function acceptInvite(token: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/invite/${token}`);
    }

    // 1. Find the invite by token using admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { data: invite, error } = await adminSupabase
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
        const { data: project } = await adminSupabase
            .from('projects')
            .select('slug')
            .eq('id', invite.project_id)
            .single();
        redirect(`/projects/${project?.slug || invite.project_id}`);
    }

    // 2. Accept it — update status and bind to the accepting user's email
    const { error: updateError } = await adminSupabase
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

    // Redirect to the project using slug if available
    const { data: project } = await adminSupabase
        .from('projects')
        .select('slug')
        .eq('id', invite.project_id)
        .single();

    redirect(`/projects/${project?.slug || invite.project_id}`);
}

export async function declineInvite(token: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/invite/${token}`);
    }

    const adminSupabase = createAdminClient();
    const { data: invite, error } = await adminSupabase
        .from('project_collaborators')
        .select('id, status')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        throw new Error('Invalid invitation');
    }

    if (invite.status === 'active') {
        // Already accepted — can't decline
        throw new Error('Invitation already accepted');
    }

    const { error: updateError } = await adminSupabase
        .from('project_collaborators')
        .update({ status: 'declined' })
        .eq('id', invite.id);

    if (updateError) {
        console.error('Error declining invite:', updateError);
        throw new Error('Failed to decline invitation');
    }

    redirect('/dashboard');
}

export async function getInviteDetails(token: string) {
    // Use admin client so unauthenticated visitors can still see full invite info
    const adminSupabase = createAdminClient();

    // Read the invite by token
    const { data: invite, error } = await adminSupabase
        .from('project_collaborators')
        .select('id, project_id, collaborator_email, revenue_share, hourly_rate, payment_type, status, invite_token')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        return { invite: null, error: error || new Error('Invite not found') };
    }

    // Fetch project details (admin client bypasses RLS for unauthenticated reads)
    const { data: project } = await adminSupabase
        .from('projects')
        .select('id, title, description, slug, user_id')
        .eq('id', invite.project_id)
        .single();

    // Fetch inviter profile (name, username, avatar)
    let inviter: { full_name: string | null; username: string | null; avatar_url: string | null } | null = null;
    if (project?.user_id) {
        const { data: inviterProfile } = await adminSupabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', project.user_id)
            .single();

        if (inviterProfile) {
            inviter = {
                full_name: inviterProfile.full_name || null,
                username: inviterProfile.username || null,
                avatar_url: inviterProfile.avatar_url || null,
            };
        }
    }

    return {
        invite: {
            ...invite,
            project: project || { title: 'Unknown Project', description: '', slug: null },
            inviter,
        },
        error: null
    };
}
