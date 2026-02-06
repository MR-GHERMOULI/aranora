'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface TeamMember {
    id: string;
    team_owner_id: string;
    member_email: string;
    role: string;
    status: string;
    created_at: string;
}

export async function getTeamMembers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching team members:', error);
        return [];
    }

    return data as TeamMember[];
}

export async function inviteTeamMember(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const email = formData.get('email') as string;
    const role = formData.get('role') as string || 'member';

    const { error } = await supabase
        .from('team_members')
        .insert({
            team_owner_id: user.id,
            member_email: email,
            role,
            status: 'pending'
        });

    if (error) {
        console.error('Error inviting team member:', error);
        throw new Error('Failed to invite team member');
    }

    revalidatePath('/dashboard/settings/team');
}

export async function removeTeamMember(memberId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_owner_id', user.id);

    if (error) {
        console.error('Error removing team member:', error);
        throw new Error('Failed to remove team member');
    }

    revalidatePath('/dashboard/settings/team');
}
