import { getProject } from "../get-project-action";
import { getInvoices } from "../../invoices/actions";
import { getTeamMembers } from "@/lib/team-helpers";
import { getTasks } from "../../tasks/actions";
import { getProjectFiles } from "../file-actions";
import { ProjectTaskList } from "@/components/projects/project-task-list";
import { ProjectFileList } from "@/components/projects/project-file-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCollaboratorDialog } from "@/components/projects/add-collaborator-dialog";
import { RemoveCollaboratorButton } from "@/components/projects/remove-collaborator-button";
import { Badge } from "@/components/ui/badge";
import { Mail, Percent, Trash2 } from "lucide-react";
import { ArrowLeft, Calendar, User, DollarSign, CheckSquare, File, FileText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ShareProgressDialog } from "@/components/projects/share-progress-dialog";
import { ProjectTimerButton } from "@/components/time-tracking/project-timer-button";

export default async function ProjectPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    // Resolve params for Next.js 15+
    const { slug } = await params;

    const project = await getProject(slug);

    if (!project) {
        notFound();
    }

    // Redirect to slug-only URL if UUID was passed as the slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    if (isUUID && project.slug) {
        redirect(`/projects/${project.slug}`);
    }

    const [invoices, teamMembers, tasks, files] = await Promise.all([
        getInvoices(undefined, project.id),
        project.team_id ? getTeamMembers(project.team_id) : Promise.resolve([]),
        getTasks({ projectId: project.id }),
        getProjectFiles(project.id)
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/projects">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{project.title}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                  ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' :
                                        project.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                            {project.status}
                        </span>
                    </div>
                    {project.description && (
                        <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <ProjectTimerButton projectId={project.id} projectTitle={project.title} />
                    <ShareProgressDialog projectId={project.id} projectTitle={project.title} />
                    <EditProjectDialog project={project} />
                    <DeleteProjectDialog projectId={project.id} projectTitle={project.title} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {project.client && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center">
                                        <User className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Client</p>
                                        <Link href={`/clients/${project.client_id}`} className="text-sm text-brand-primary hover:underline">
                                            {project.client.name}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </div>

                                <div>
                                    <p className="text-sm font-medium">Budget</p>
                                    <p className="text-sm text-muted-foreground">{project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Timeline</p>
                                    <div className="text-sm text-muted-foreground">
                                        {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Start TBD'}
                                        {' - '}
                                        {project.end_date ? format(new Date(project.end_date), 'MMM d, yyyy') : 'End TBD'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="tasks" className="w-full">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="files">Files & Documents</TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="team">Team</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks" className="mt-4">
                            <ProjectTaskList tasks={tasks} projectId={project.id} />
                        </TabsContent>
                        <TabsContent value="files" className="mt-4">
                            <ProjectFileList files={files} projectId={project.id} />
                        </TabsContent>
                        <TabsContent value="invoices" className="mt-4 space-y-4">
                            {invoices.length === 0 ? (
                                <Card>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            No invoices found.
                                            <div className="mt-4">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="/invoices/new">Create Invoice</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                invoices.map((invoice) => (
                                    <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-md font-semibold truncate">
                                                {invoice.invoice_number}
                                            </CardTitle>
                                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                                ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                    invoice.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                                {invoice.status}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-1 mt-2">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                ${invoice.total.toLocaleString()}
                                            </div>
                                            {invoice.due_date && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="justify-end py-3">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/invoices/${invoice.invoice_number}`}>View Details</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="team" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="h-4 w-4" /> Team Members
                                        </CardTitle>
                                        <CardDescription>Workspace members who can access this project.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {teamMembers.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No team members found.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {teamMembers.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-lg">
                                                            {/* @ts-ignore */}
                                                            {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm">
                                                                    {/* @ts-ignore */}
                                                                    {member.profiles?.full_name || member.profiles?.email}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'} className="text-xs">
                                                                    {member.role}
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Joined {new Date(member.joined_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
