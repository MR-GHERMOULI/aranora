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
    if (user) {
        const { data: pData } = await supabase
            .from('projects')
            .select('id, title')
            .eq('user_id', user.id);

        projects = pData || [];
    }

    return (
        <TasksClient
            tasks={tasks}
            projects={projects}
            stats={stats}
            currentUserId={user?.id}
        />
    );
}
