'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface Collaborator {
    id: string;
    project_id: string;
    collaborator_email: string;
    revenue_share: number;
    status: string;
    created_at: string;
}

export async function getProjectCollaborators(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: collaborators, error: collError } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId);

    if (collError || !collaborators) return [];

    const emails = collaborators.map(c => c.collaborator_email);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('username, full_name, company_email')
        .in('company_email', emails);

    const result = collaborators.map(coll => ({
        ...coll,
        profile: profiles?.find(p => p.company_email === coll.collaborator_email)
    }));

    return result;
}

export async function addCollaborator(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const projectId = formData.get('projectId') as string;
    const email = formData.get('email') as string;
    const revenueShare = parseFloat(formData.get('revenueShare') as string) || 0;

    // Check if user exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('company_email', email)
        .single();

    const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

    let status = 'invited';
    let inviteType = 'link'; // 'notification' or 'link'

    if (existingUser) {
        inviteType = 'notification';
    }

    const { data: newCollaborator, error } = await supabase
        .from('project_collaborators')
        .insert({
            project_id: projectId,
            collaborator_email: email,
            revenue_share: revenueShare,
            status: status
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding collaborator:', error);
        throw new Error('Failed to add collaborator');
    }

    if (inviteType === 'notification' && existingUser) {
        // Create notification
        await supabase.from('notifications').insert({
            user_id: existingUser.id,
            type: 'invite',
            payload: {
                projectId,
                projectName: (await supabase.from('projects').select('title').eq('id', projectId).single()).data?.title,
                inviterName: inviterProfile?.full_name || user.email,
                inviterUsername: inviterProfile?.username,
                collaboratorId: newCollaborator.id
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}`);
        return {
            type: 'existing',
            message: `User @${existingUser.username} notified`,
            username: existingUser.username
        };
    } else {
        // Return info for the link
        revalidatePath(`/dashboard/projects/${projectId}`);
        return {
            type: 'new',
            inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${newCollaborator.invite_token}`,
            token: newCollaborator.invite_token
        };
    }
}

export async function removeCollaborator(collaboratorId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

    if (error) {
        console.error('Error removing collaborator:', error);
        throw new Error('Failed to remove collaborator');
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
}
