import { getContracts, getTemplates } from "./actions";
import { getClients } from "../clients/actions";
import { getProjects } from "../projects/actions";
import { AddContractDialog } from "@/components/contracts/add-contract-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, User, CheckCircle, Send, Clock, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function ContractsPage() {
    const [contracts, clients, projects, templates] = await Promise.all([
        getContracts(),
        getClients(),
        getProjects(),
        getTemplates()
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Contracts</h2>
                    <p className="text-muted-foreground">
                        Manage legal agreements and electronic signatures.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/contracts/templates">
                            <LayoutTemplate className="mr-2 h-4 w-4" />
                            Templates
                        </Link>
                    </Button>
                    <AddContractDialog clients={clients} projects={projects} templates={templates} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contracts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No contracts found. Create your first contract.</p>
                    </div>
                ) : (
                    contracts.map((contract) => (
                        <Card key={contract.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {contract.title}
                                </CardTitle>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1
                                    ${contract.status === 'Signed' ? 'bg-green-100 text-green-700' :
                                        contract.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                    {contract.status === 'Signed' && <CheckCircle className="h-3 w-3" />}
                                    {contract.status === 'Sent' && <Send className="h-3 w-3" />}
                                    {contract.status === 'Draft' && <Clock className="h-3 w-3" />}
                                    {contract.status}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 mt-2">
                                {contract.client && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        {contract.client.name}
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
                                </div>
                                {contract.sent_at && (
                                    <div className="flex items-center text-sm text-blue-600">
                                        <Send className="mr-2 h-4 w-4" />
                                        Sent {format(new Date(contract.sent_at), 'MMM d, yyyy')}
                                    </div>
                                )}
                                {contract.signed_at && (
                                    <div className="flex items-center text-sm text-green-600">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Signed {format(new Date(contract.signed_at), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/contracts/${contract.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
