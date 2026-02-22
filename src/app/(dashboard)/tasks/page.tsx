import { getTasks, getTaskStats } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage() {
    const [tasks, stats] = await Promise.all([
        getTasks({ excludeProjectTasks: true }),
        getTaskStats(),
    ]);

    // Fetch projects for the dropdown
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let projects: any[] = [];
    let teamMembers: any[] = [];
    if (user) {
        const [pResult, tmResult] = await Promise.all([
            supabase.from('projects').select('id, title').eq('user_id', user.id),
            (async () => {
                try {
                    return await supabase.rpc('get_user_team_members', { user_id_param: user.id });
                } catch {
                    return { data: [] };
                }
            })()
        ]);
        const pData = pResult.data;
        const tmData = tmResult?.data;

        // Fallback if RPC fails, we just fetch from team_members where they are part of the team
        if (tmData) {
            teamMembers = tmData;
        } else {
            // Get teams the user is in
            const { data: myTeams } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
            if (myTeams && myTeams.length > 0) {
                const teamIds = myTeams.map(t => t.team_id);
                const { data: members } = await supabase
                    .from('team_members')
                    .select('user_id, role, profiles(full_name, email)')
                    .in('team_id', teamIds);

                // Deduplicate members
                const uniqueMembers = new Map();
                members?.forEach(m => {
                    if (!uniqueMembers.has(m.user_id)) {
                        uniqueMembers.set(m.user_id, m);
                    }
                });
                teamMembers = Array.from(uniqueMembers.values());
            }
        }
        projects = pData || [];
    }

    return (
        <TasksClient
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            stats={stats}
        />
    );
}
