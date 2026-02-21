import { getContract } from "../actions";
import { getClients } from "../../clients/actions";
import { getProjects } from "../../projects/actions";
import { getProfile } from "../../settings/actions";
import { EditContractDialog } from "@/components/contracts/edit-contract-dialog";
import { DeleteContractDialog } from "@/components/contracts/delete-contract-dialog";
import { DownloadContractButton } from "@/components/contracts/download-contract-button";
import { SendContractDialog } from "@/components/contracts/send-contract-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, User, CheckCircle, FileText, Send, Clock, Shield, Globe, Monitor } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [contract, clients, projects, profile] = await Promise.all([
        getContract(id),
        getClients(),
        getProjects(),
        getProfile()
    ]);

    if (!contract) {
        notFound();
    }

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/contracts">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{contract.title}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1
                            ${contract.status === 'Signed' ? 'bg-green-100 text-green-700' :
                                contract.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'}`}>
                            {contract.status === 'Signed' && <CheckCircle className="h-3 w-3" />}
                            {contract.status === 'Sent' && <Send className="h-3 w-3" />}
                            {contract.status === 'Draft' && <Clock className="h-3 w-3" />}
                            {contract.status}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Created on {format(new Date(contract.created_at), 'MMM d, yyyy')}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <DownloadContractButton contract={contract} profile={profile} />
                    {contract.status !== 'Signed' && (
                        <EditContractDialog contract={contract} clients={clients} projects={projects} />
                    )}
                    <SendContractDialog
                        contractId={contract.id}
                        contractTitle={contract.title}
                        existingToken={contract.signing_token}
                        status={contract.status}
                    />
                    <DeleteContractDialog contractId={contract.id} contractTitle={contract.title} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-6">
                    {/* Parties Card */}
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
                                        <Link href={`/clients/${contract.client_id}`} className="text-sm text-brand-primary hover:underline">
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
                                        <Link href={`/projects/${contract.project_id}`} className="text-sm text-brand-primary hover:underline">
                                            {contract.project.title}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        {contract.sent_at && (
                            <CardFooter className="bg-blue-50 border-t border-blue-100 p-4">
                                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                                    <Send className="h-4 w-4" />
                                    Sent on {format(new Date(contract.sent_at), 'MMM d, yyyy h:mm a')}
                                </div>
                            </CardFooter>
                        )}
                        {contract.signed_at && (
                            <CardFooter className="bg-green-50 border-t border-green-100 p-4">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Signed on {format(new Date(contract.signed_at), 'MMM d, yyyy h:mm a')}
                                </div>
                            </CardFooter>
                        )}
                    </Card>

                    {/* Signature Details Card */}
                    {contract.status === 'Signed' && contract.signer_name && (
                        <Card className="border-green-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    Signature Details
                                </CardTitle>
                                <CardDescription>Electronic signature information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Signer Name</p>
                                    <p className="text-sm font-medium">{contract.signer_name}</p>
                                </div>
                                {contract.signer_email && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Signer Email</p>
                                        <p className="text-sm">{contract.signer_email}</p>
                                    </div>
                                )}
                                {contract.signed_at && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Signed At</p>
                                        <p className="text-sm">{format(new Date(contract.signed_at), 'MMM d, yyyy h:mm:ss a')}</p>
                                    </div>
                                )}
                                {contract.signer_ip && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">IP: {contract.signer_ip}</p>
                                    </div>
                                )}
                                {contract.signer_user_agent && (
                                    <div className="flex items-start gap-1.5">
                                        <Monitor className="h-3 w-3 text-muted-foreground mt-0.5" />
                                        <p className="text-xs text-muted-foreground break-all line-clamp-2">{contract.signer_user_agent}</p>
                                    </div>
                                )}

                                {/* Signature Image */}
                                {contract.signature_data && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Signature</p>
                                        <div className="bg-white border rounded-lg p-2">
                                            <img
                                                src={contract.signature_data}
                                                alt="Client signature"
                                                className="max-w-full h-auto"
                                                style={{ maxHeight: '100px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
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
                    </Card>
                </div>
            </div>
        </div>
    );
}
