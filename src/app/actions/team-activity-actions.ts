'use server';

import { createClient } from "@/lib/supabase/server";
import { getActiveTeamId } from "@/lib/team-helpers";
import { redirect } from "next/navigation";

export interface TeamActivityLog {
    id: string;
    team_id: string;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    entity_name: string | null;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export async function getTeamActivity(limit: number = 50): Promise<TeamActivityLog[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getActiveTeamId();

    if (!teamId) {
        return [];
    }

    const { data: activity, error } = await supabase
        .from('team_activity')
        .select(`
            *,
            user:profiles!user_id(full_name, email)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching team activity:', error);
        return [];
    }

    return (activity || []).map(log => ({
        ...log,
        user: Array.isArray(log.user) ? log.user[0] : log.user
    })) as TeamActivityLog[];
}
