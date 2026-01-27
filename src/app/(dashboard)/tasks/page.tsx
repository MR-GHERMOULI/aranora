import { getTasks } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskList } from "@/components/tasks/task-list";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TasksPage() {
    const tasks = await getTasks();

    // Fetch projects for the dropdown
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let projects: any[] = [];
    if (user) {
        const { data } = await supabase.from('projects').select('id, title').eq('user_id', user.id);
        projects = data || [];
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 lg:p-8 gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Task Planner</h1>
                    <p className="text-muted-foreground">Manage your personal and project tasks.</p>
                </div>
                <CreateTaskDialog projects={projects} />
            </div>

            <Tabs defaultValue="board" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="board">Kanban Board</TabsTrigger>
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="board" className="flex-1 overflow-hidden h-full">
                    <TaskBoard tasks={tasks} />
                </TabsContent>

                <TabsContent value="list" className="h-full overflow-y-auto">
                    <TaskList tasks={tasks} />
                </TabsContent>

                <TabsContent value="calendar" className="h-full overflow-y-auto">
                    <TaskCalendar tasks={tasks} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
