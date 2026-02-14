import { getProjects } from "./actions";
import { getClients } from "../clients/actions";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function ProjectsPage() {
    const [projects, clients] = await Promise.all([
        getProjects(),
        getClients()
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Projects</h2>
                    <p className="text-muted-foreground">
                        Track your ongoing projects and deadlines.
                    </p>
                </div>
                <AddProjectDialog clients={clients} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No projects found. Create your first project to get started.
                    </div>
                ) : (
                    projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {project.title}
                                </CardTitle>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                        project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' :
                                                project.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                    {project.status}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 mt-2">
                                {project.client && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        {project.client.name}
                                    </div>
                                )}
                                {project.budget && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        ${project.budget.toLocaleString()}
                                    </div>
                                )}
                                {project.end_date && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Due {format(new Date(project.end_date), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/projects/${project.id}/${project.slug}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
