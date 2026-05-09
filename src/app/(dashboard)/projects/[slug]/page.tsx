import { getProject } from "../get-project-action";
import { getInvoices } from "../../invoices/actions";
import { getTasks } from "../../tasks/actions";
import { getProjectFiles } from "../file-actions";
import { getProjectTimeEntries } from "../../time-tracking/actions";
import { getContracts } from "../../contracts/actions";
import { ProjectTaskList } from "@/components/projects/project-task-list";
import { ProjectFileList } from "@/components/projects/project-file-list";
import { ProjectTimeTrackingTab } from "@/components/projects/project-time-tracking-tab";
import { ProjectContractsTab } from "@/components/projects/project-contracts-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCollaboratorDialog } from "@/components/projects/add-collaborator-dialog";
import { RemoveCollaboratorButton } from "@/components/projects/remove-collaborator-button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, DollarSign, CheckSquare, File, FileText, Timer, FileSignature, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ShareProgressDialog } from "@/components/projects/share-progress-dialog";
import { ProjectTimerButton } from "@/components/time-tracking/project-timer-button";
import { getProjectCollaborators } from "../collaborator-actions";
import { getProfile } from "../../settings/actions";
import { getIntakeForms, getSubmissions } from "../../intake-forms/actions";
import { ProjectIntakeTab } from "@/components/projects/project-intake-tab";
import { ClipboardList } from "lucide-react";

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

    const [invoices, tasks, files, allTimeEntries, collaborators, allContracts, profile, allSubmissions, allForms] = await Promise.all([
        getInvoices(undefined, project.id),
        getTasks({ projectId: project.id }),
        getProjectFiles(project.id),
        getProjectTimeEntries(project.id),
        getProjectCollaborators(project.id),
        getContracts(),
        getProfile(),
        getSubmissions(),
        getIntakeForms()
    ]);

    const projectContracts = allContracts.filter(c => c.project_id === project.id);
    const linkedSubmissions = allSubmissions.filter(s => s.converted_project_id === project.id);

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

                            {collaborators.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Collaborators</p>
                                            <AddCollaboratorDialog projectId={project.id} />
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            {collaborators.map((coll) => (
                                                <div key={coll.id} className="flex items-center justify-between group">
                                                    <div className="flex flex-col min-w-0">
                                                                <span className="text-sm truncate">
                                                                    {coll.profile?.full_name || (coll as any).crm_entry?.full_name || coll.collaborator_email}
                                                                </span>
                                                        {coll.payment_type === 'revenue_share' ? (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {coll.revenue_share}% Share
                                                            </span>
                                                        ) : coll.hourly_rate ? (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ${coll.hourly_rate}/h
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <RemoveCollaboratorButton collaboratorId={coll.id} projectId={project.id} email={coll.collaborator_email} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {collaborators.length === 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-medium">Collaborators</p>
                                    </div>
                                    <AddCollaboratorDialog projectId={project.id} />
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
                            <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                            <TabsTrigger value="contracts" className="gap-1.5">
                                <FileSignature className="h-3.5 w-3.5" />
                                Contracts
                                {projectContracts.length > 0 && (
                                    <span className="ml-1 h-4 min-w-4 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-bold flex items-center justify-center px-1">
                                        {projectContracts.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="intake" className="gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Intake Forms
                                {linkedSubmissions.length > 0 && (
                                    <span className="ml-1 h-4 min-w-4 rounded-full bg-rose-500/10 text-rose-600 text-[9px] font-bold flex items-center justify-center px-1">
                                        {linkedSubmissions.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="nexus" className="gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                Nexus
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks" className="mt-4">
                            <ProjectTaskList tasks={tasks} projectId={project.id} />
                        </TabsContent>
                        <TabsContent value="files" className="mt-4">
                            <ProjectFileList files={files} projectId={project.id} />
                        </TabsContent>
                        <TabsContent value="time-tracking" className="mt-4">
                            <ProjectTimeTrackingTab entries={allTimeEntries} projectId={project.id} isOwner={project.user_id === profile?.id} />
                        </TabsContent>
                        <TabsContent value="contracts" className="mt-4">
                            <ProjectContractsTab
                                contracts={projectContracts}
                                projectId={project.id}
                                projectTitle={project.title}
                                profile={profile}
                            />
                        </TabsContent>
                        <TabsContent value="intake" className="mt-4">
                            <ProjectIntakeTab
                                submissions={linkedSubmissions}
                                forms={allForms}
                                allSubmissions={allSubmissions}
                                projectId={project.id}
                                projectTitle={project.title}
                            />
                        </TabsContent>
                        <TabsContent value="nexus" className="mt-4">
                            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                                <CardContent className="p-0">
                                    <div className="relative flex flex-col items-center justify-center py-16 px-8 text-center">
                                        {/* Decorative background grid */}
                                        <div className="absolute inset-0 opacity-[0.04]" style={{
                                            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                                            backgroundSize: '24px 24px',
                                        }} />

                                        {/* Glow effect */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px]" />

                                        {/* Icon */}
                                        <div className="relative mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/25 ring-1 ring-white/10">
                                                <Sparkles className="h-8 w-8 text-white" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                                        </div>

                                        {/* Content */}
                                        <h3 className="relative text-xl font-bold text-white mb-2 tracking-tight">
                                            Open Nexus Workspace
                                        </h3>
                                        <p className="relative text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                                            Launch the full visual workspace for <span className="text-blue-400 font-semibold">{project.title}</span>. 
                                            Draw diagrams, map ideas, and convert them into actionable tasks.
                                        </p>

                                        {/* CTA Button */}
                                        <Button asChild size="lg" className="relative bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl px-8 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5 group">
                                            <Link href={`/nexus?project=${project.id}&name=${encodeURIComponent(project.title)}`}>
                                                <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                                                Open Workspace — {project.title}
                                                <ExternalLink className="h-3.5 w-3.5 ml-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                            </Link>
                                        </Button>

                                        {/* Keyboard hint */}
                                        <p className="relative text-[11px] text-slate-500 mt-4 font-medium">
                                            Your work is auto-saved and linked to this project
                                        </p>
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
                                                <Link href={`/invoices/${invoice.invoice_number}`}>View Details</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
