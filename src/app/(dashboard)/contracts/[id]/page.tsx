import { getContract } from "../actions";
import { getClients } from "../../clients/actions";
import { getProjects } from "../../projects/actions";
import { getProfile } from "../../settings/actions";
import { EditContractDialog } from "@/components/contracts/edit-contract-dialog";
import { DeleteContractDialog } from "@/components/contracts/delete-contract-dialog";
import { DownloadContractButton } from "@/components/contracts/download-contract-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { SignContractButton } from "@/components/contracts/sign-button";

export default async function ContractPage({ params }: { params: { id: string } }) {
    const [contract, clients, projects, profile] = await Promise.all([
        getContract(params.id),
        getClients(),
        getProjects(),
        getProfile()
    ]);

    if (!contract) {
        notFound();
    }

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/contracts">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{contract.title}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                  ${contract.status === 'Signed' ? 'bg-green-100 text-green-700' :
                                contract.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'}`}>
                            {contract.status}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Created on {format(new Date(contract.created_at), 'MMM d, yyyy')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <DownloadContractButton contract={contract} profile={profile} />
                    {contract.status !== 'Signed' && (
                        <EditContractDialog contract={contract} clients={clients} projects={projects} />
                    )}
                    <DeleteContractDialog contractId={contract.id} contractTitle={contract.title} />
                    {contract.status !== 'Signed' && (
                        <SignContractButton id={contract.id} />
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Parties</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contract.client && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center">
                                        <User className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Client</p>
                                        <Link href={`/dashboard/clients/${contract.client_id}`} className="text-sm text-brand-primary hover:underline">
                                            {contract.client.name}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {contract.project && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Project</p>
                                        <Link href={`/dashboard/projects/${contract.project_id}`} className="text-sm text-brand-primary hover:underline">
                                            {contract.project.title}
                                        </Link>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                        {contract.signed_at && (
                            <CardFooter className="bg-green-50 border-t border-green-100 p-4">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Signed on {format(new Date(contract.signed_at), 'MMM d, yyyy h:mm a')}
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>

                {/* Contract Content */}
                <div className="md:col-span-2">
                    <Card className="min-h-[500px]">
                        <CardHeader>
                            <CardTitle>Agreement Terms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-gray-50/50 whitespace-pre-wrap">
                                {contract.content}
                            </div>
                        </CardContent>
                        {contract.status !== 'Signed' && (
                            <CardFooter className="justify-end border-t pt-6">
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-muted-foreground">By clicking sign, you agree to the terms above.</p>
                                    <SignContractButton id={contract.id} />
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
