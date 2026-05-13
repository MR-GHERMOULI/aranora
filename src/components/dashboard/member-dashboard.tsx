import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, ArrowRight, Play, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MemberDashboard({ stats }: { stats: any }) {
    const formatHours = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">My Tasks (Todo)</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.todoTasks || 0}</div>
                    </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Projects</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.assignedProjects || 0}</div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Hours This Week</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatHours(stats.weeklySeconds || 0)}</div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Timer</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-medium mt-1">Ready to work?</div>
                        <Button variant="link" asChild className="p-0 h-auto text-green-600">
                            <Link href="/time-tracking">Go to Time Tracking <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Tasks */}
                <Card className="col-span-1 shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                My Upcoming Tasks
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/tasks">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {stats.recentTasks && stats.recentTasks.length > 0 ? (
                            <div className="divide-y">
                                {stats.recentTasks.map((task: any) => (
                                    <div key={task.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium">{task.title}</p>
                                                {task.project?.title && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">Project: {task.project.title}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={
                                            task.priority === 'High' ? 'text-red-600 bg-red-50 border-red-200' :
                                            task.priority === 'Medium' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                            'text-blue-600 bg-blue-50 border-blue-200'
                                        }>
                                            {task.priority || 'Normal'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                <CheckCircle2 className="h-8 w-8 text-muted/30 mb-3" />
                                <p className="text-sm">You have no upcoming tasks.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assigned Projects */}
                <Card className="col-span-1 shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-500" />
                                Active Projects
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/projects">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {stats.recentProjects && stats.recentProjects.length > 0 ? (
                            <div className="divide-y">
                                {stats.recentProjects.map((project: any) => (
                                    <div key={project.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                                <Briefcase className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <Link href={`/projects/${project.slug || project.id}`} className="text-sm font-medium hover:underline">
                                                    {project.title}
                                                </Link>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/nexus?project=${project.id}`}>Nexus <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                <Briefcase className="h-8 w-8 text-muted/30 mb-3" />
                                <p className="text-sm">You are not assigned to any active projects yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
