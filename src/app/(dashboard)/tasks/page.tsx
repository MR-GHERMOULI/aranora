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
        const { data: pData } = await supabase
            .from('projects')
            .select('id, title')
            .eq('user_id', user.id);

        projects = pData || [];

        // Single-user mode: current user is the only "member"
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        teamMembers = [{
            user_id: user.id,
            role: 'owner',
            profiles: profile || { full_name: '', email: '' }
        }];
    }

    return (
        <TasksClient
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            stats={stats}
            currentUserId={user?.id}
        />
    );
}
