'use server';

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
    // Team features removed
    return [];
}
