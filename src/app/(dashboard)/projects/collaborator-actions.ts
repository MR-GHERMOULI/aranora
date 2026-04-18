'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscription-guard";

export interface Collaborator {
    id: string;
    project_id: string;
    collaborator_email: string;
    revenue_share: number;
    hourly_rate?: number | null;
    payment_type: 'revenue_share' | 'hourly';
    status: string;
    created_at: string;
    invite_token?: string;
    profile?: {
        username: string;
        full_name: string;
        company_email: string;
        avatar_url?: string;
    };
    crm_entry?: {
        full_name: string;
        email: string;
    };
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

    if (collError || !collaborators || collaborators.length === 0) return [];

    const emails = collaborators.map(c => c.collaborator_email);
    
    // Fetch profiles of users who have signed up
    const { data: profiles } = await supabase
        .from('profiles')
        .select('username, full_name, company_email, avatar_url')
        .in('company_email', emails);

    // Fetch matches from CRM directory
    const { data: crmEntries } = await supabase
        .from('collaborators_crm')
        .select('full_name, email')
        .eq('user_id', user.id)
        .in('email', emails);

    const result = collaborators.map(coll => ({
        ...coll,
        profile: profiles?.find(p => p.company_email === coll.collaborator_email),
        crm_entry: crmEntries?.find(c => c.email === coll.collaborator_email)
    }));

    return result;
}

export async function addCollaborator(formData: FormData) {
    await requireActiveSubscription();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const projectId = formData.get('projectId') as string;
    const email = formData.get('email') as string;
    const revenueShare = parseFloat(formData.get('revenueShare') as string) || 0;
    const hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;
    const paymentType = (formData.get('paymentType') as string) || 'revenue_share';

    // Check if they are already a collaborator to avoid unique constraint error
    const { data: existingColl } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('collaborator_email', email)
        .maybeSingle();

    if (existingColl) {
        return {
            type: 'already_exists',
            status: existingColl.status,
            inviteLink: existingColl.invite_token
                ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${existingColl.invite_token}`
                : undefined,
            message: existingColl.status === 'active'
                ? 'This person is already an active collaborator on this project.'
                : existingColl.status === 'declined'
                    ? 'This person previously declined the invitation.'
                    : 'An invitation has already been sent to this person.'
        };
    }

    // Check if user exists (use maybeSingle to avoid PGRST116 errors on non-existent users)
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('company_email', email)
        .maybeSingle();

    const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle();

    const { data: projectInfo } = await supabase
        .from('projects')
        .select('title, slug')
        .eq('id', projectId)
        .maybeSingle();

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
            hourly_rate: hourlyRate,
            payment_type: paymentType,
            status: status
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding collaborator:', error);
        throw new Error('Failed to add collaborator');
    }

    // Proper revalidation path
    revalidatePath('/projects');
    if (projectInfo?.slug) {
        revalidatePath(`/projects/${projectInfo.slug}`);
    }

    if (inviteType === 'notification' && existingUser) {
        // Create in-platform notification for the registered user
        const { error: notifError } = await supabase.from('notifications').insert({
            user_id: existingUser.id,
            type: 'invite',
            payload: {
                projectId,
                projectSlug: projectInfo?.slug || projectId,
                projectName: projectInfo?.title || 'a project',
                inviterName: inviterProfile?.full_name || user.email,
                inviterUsername: inviterProfile?.username,
                collaboratorId: newCollaborator.id,
                inviteToken: newCollaborator.invite_token
            }
        });

        if (notifError) {
            console.error('Error creating invite notification:', notifError);
            // Notification failed but collaborator record was created — return invite link as fallback
            return {
                type: 'new',
                inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${newCollaborator.invite_token}`,
                token: newCollaborator.invite_token,
                message: 'User found but notification failed. Share this invite link instead.'
            };
        }

        return {
            type: 'notified',
            message: `Invitation sent to @${existingUser.username}`,
            username: existingUser.username,
            fullName: existingUser.full_name
        };
    } else {
        // User not registered — return invite link
        return {
            type: 'new',
            inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${newCollaborator.invite_token}`,
            token: newCollaborator.invite_token
        };
    }
}

export async function removeCollaborator(collaboratorId: string, projectId: string) {
    await requireActiveSubscription();
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

export async function getProjectMembers(projectId: string) {
    const supabase = await createClient();

    // Get Project Owner & Team ID
    const { data: project } = await supabase
        .from('projects')
        .select('user_id, team_id')
        .eq('id', projectId)
        .single();

    if (!project) return [];

    const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, company_email')
        .eq('id', project.user_id)
        .single();

    // Get Team Members
    let teamMemberProfiles: any[] = [];
    if (project.team_id) {
        const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', project.team_id);
            
        if (teamMembers && teamMembers.length > 0) {
            const userIds = teamMembers.map(tm => tm.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, company_email')
                .in('id', userIds);
                
            if (profiles) {
                // Filter out the owner if they are also a team member to avoid duplicates
                teamMemberProfiles = profiles.filter(p => p.id !== project.user_id);
            }
        }
    }

    // Get Active/Invited Collaborators
    const { data: collaborators } = await supabase
        .from('project_collaborators')
        .select('collaborator_email')
        .eq('project_id', projectId)
        .in('status', ['active', 'invited']);

    let collaboratorProfiles: any[] = [];
    const emails = collaborators?.map(c => c.collaborator_email) || [];
    
    if (emails.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, company_email')
            .in('company_email', emails);
            
        if (profiles) {
           collaboratorProfiles = profiles;
        }
    }

    const members = [];
    if (ownerProfile) members.push({ ...ownerProfile, member_type: 'owner' });
    
    // Add team members
    for (const profile of teamMemberProfiles) {
        members.push({ ...profile, member_type: 'team' });
    }
    
    // Add collaborators
    for (const profile of collaboratorProfiles) {
        // Only add if not already in the list (e.g. a team member who is also a collaborator)
        if (!members.find(m => m.id === profile.id)) {
            members.push({ ...profile, member_type: 'partner' });
        }
    }

    return members;
}
