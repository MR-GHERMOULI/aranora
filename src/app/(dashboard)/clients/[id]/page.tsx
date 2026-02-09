import { getClient } from "../get-client-action";
import { getProjects } from "../../projects/actions";
import { getInvoices } from "../../invoices/actions";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Briefcase, DollarSign, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // Parallel fetching
    const [client, projects, invoices] = await Promise.all([
        getClient(id),
        getProjects(id),
        getInvoices(id)
    ]);

    if (!client) {
        notFound();
    }

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{client.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                  ${client.status === 'Active' ? 'bg-green-100 text-green-700' :
                                client.status === 'Potential' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'}`}>
                            {client.status}
                        </span>
                        <span className="text-sm">Added on {format(new Date(client.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <EditClientDialog client={client} />
                    <DeleteClientDialog clientId={client.id} clientName={client.name} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground truncate" title={client.email || undefined}>{client.email || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm text-muted-foreground">{client.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-1">Notes</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {client.notes || 'No notes added.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="projects" className="w-full">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="mt-4 space-y-4">
                            {projects.length === 0 ? (
                                <Card>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            No projects found for this client.
                                            <div className="mt-4">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="/projects">Create Project</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                projects.map((project: any) => (
                                    <Card key={project.id} className="hover:shadow-sm transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-md font-semibold truncate">
                                                {project.title}
                                            </CardTitle>
                                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                                ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {project.status}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-1 mt-2">
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
                                        <CardFooter className="justify-end py-3">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/projects/${project.id}`}>View Details</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="invoices" className="mt-4 space-y-4">
                            {invoices.length === 0 ? (
                                <Card>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            No invoices found for this client.
                                            <div className="mt-4">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="/invoices/new">Create Invoice</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                invoices.map((invoice: any) => (
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
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
