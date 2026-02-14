import { getProject } from "../../get-project-action";
import { getInvoices } from "../../../invoices/actions";
import { getProjectCollaborators } from "../../collaborator-actions";
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

export default async function ProjectPage({
    params
}: {
    params: Promise<{ id: string; slug: string }>
}) {
    // Resolve params for Next.js 15+
    const { id, slug } = await params;

    const [project, invoices, collaborators] = await Promise.all([
        getProject(id),
        getInvoices(undefined, id),
        getProjectCollaborators(id)
    ]);

    if (!project) {
        notFound();
    }

    // Redirect if slug is wrong (SEO maintenance)
    if (project.slug !== slug) {
        redirect(`/projects/${id}/${project.slug}`);
    }

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
                            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4" /> Project Tasks
                                    </CardTitle>
                                    <CardDescription>Manage tasks and milestones for this project.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        No tasks added yet. <br /> (Task management coming in Intermediate Features)
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" disabled>Add Task</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="files" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <File className="h-4 w-4" /> Files
                                    </CardTitle>
                                    <CardDescription>Upload and manage project documents.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        No files uploaded.
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm">Upload File</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
                                                <Link href={`/invoices/${invoice.id}`}>View Details</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="collaborators" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="h-4 w-4" /> Collaborators
                                        </CardTitle>
                                        <CardDescription>Manage freelancers working on this project.</CardDescription>
                                    </div>
                                    <AddCollaboratorDialog projectId={project.id} />
                                </CardHeader>
                                <CardContent>
                                    {collaborators.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No collaborators invited.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {collaborators.map((c) => (
                                                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                                                            <Mail className="h-5 w-5 text-pink-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm">
                                                                    {/* @ts-ignore */}
                                                                    {c.profile?.full_name || c.collaborator_email}
                                                                </p>
                                                                {/* @ts-ignore */}
                                                                {c.profile?.username && (
                                                                    <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-1.5 py-0.5 rounded">
                                                                        @{c.profile.username}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                                    {c.status}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Percent className="h-3 w-3" /> {c.revenue_share}% Share
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <RemoveCollaboratorButton
                                                        collaboratorId={c.id}
                                                        projectId={project.id}
                                                        email={c.collaborator_email}
                                                    />
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
