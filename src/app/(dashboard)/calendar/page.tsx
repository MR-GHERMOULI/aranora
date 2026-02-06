import { getTasks } from "./actions";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTaskDialog } from "@/components/calendar/add-task-dialog";
import { TaskItem } from "@/components/calendar/task-item";
import { getProjects } from "../projects/actions";

export default async function CalendarPage() {
    const [tasks, projects] = await Promise.all([
        getTasks(),
        getProjects()
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Calendar & Tasks</h2>
                    <p className="text-muted-foreground">
                        Manage your schedule and to-do list.
                    </p>
                </div>
                <AddTaskDialog projects={projects} />
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-8 lg:col-span-4">
                    <Card>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={new Date()}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-12 lg:col-span-8 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Tasks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No upcoming tasks.</p>
                            ) : (
                                tasks.map(task => (
                                    <TaskItem key={task.id} task={task} projects={projects} />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

