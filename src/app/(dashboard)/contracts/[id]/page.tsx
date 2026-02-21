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
import { ArrowLeft, User, CheckCircle, FileText, Send, Clock, Shield, Globe, Monitor, PenTool, LayoutTemplate, Briefcase, Activity } from "lucide-react";
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

    // Determine timeline progress
    const timeline = [
        { label: "Draft Created", date: contract.created_at, icon: Clock, completed: true },
        { label: "Sent for Signature", date: contract.sent_at, icon: Send, completed: !!contract.sent_at },
        { label: "Signed by Client", date: contract.signed_at, icon: CheckCircle, completed: !!contract.signed_at }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pt-8 pb-20">
            {/* Minimal Top Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-slate-900" asChild>
                    <Link href="/contracts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Contracts
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
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

            <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start relative">

                {/* Left Side: Document Viewer (Main Content) */}
                <div className="flex-1 w-full flex flex-col items-center">
                    <div className="w-full max-w-4xl bg-white border border-slate-200 shadow-xl rounded-sm p-10 sm:p-16 lg:p-24 min-h-[1056px] relative overflow-hidden">
                        {/* Decorative top binder edge */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

                        {/* Title and Badge IN the Document, optional styling */}
                        <div className="border-b-2 border-slate-900 pb-8 mb-12 flex justify-between items-end">
                            <h1 className="text-4xl font-serif text-slate-900 tracking-tight leading-tight max-w-[80%]">{contract.title}</h1>
                            {contract.status === 'Signed' && (
                                <div className="flex flex-col items-center space-y-1 opacity-80 rotate-[-5deg] mb-2">
                                    <div className="px-3 py-1 border-2 border-emerald-600 rounded text-emerald-600 font-bold uppercase tracking-widest text-xs">
                                        Fully Executed
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-medium">
                                        {format(new Date(contract.signed_at!), 'MM/dd/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actual Contract Content */}
                        <div className="prose prose-slate prose-headings:font-serif prose-p:font-serif max-w-none text-slate-800 leading-loose prose-a:text-brand-primary whitespace-pre-wrap">
                            {contract.content}
                        </div>

                        {/* Signature Block Rendering at the bottom if signed */}
                        {contract.status === 'Signed' && contract.signature_data && (
                            <div className="mt-24 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Client Signature</p>
                                    <div className="h-24 w-full flex items-center justify-start mb-2">
                                        <img src={contract.signature_data} alt="Signature" className="max-h-full max-w-full" />
                                    </div>
                                    <div className="border-t border-slate-900 pt-2">
                                        <p className="font-semibold text-slate-900">{contract.signer_name}</p>
                                        <p className="text-xs text-slate-500">{contract.signer_email}</p>
                                        <p className="text-xs text-slate-500 mt-1">Signed on {format(new Date(contract.signed_at!), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                <div>
                                    {/* Freelancer block if needed, but keeping it empty/structured for symmetry */}
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Service Provider</p>
                                    <div className="h-24 w-full flex items-center justify-start mb-2">
                                        {/* Assumed pre-signed or standard text for freelancer */}
                                        <div className="font-[Signature-Font] italic text-3xl text-slate-800 opacity-70">
                                            {profile.full_name || profile.company_name}
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-900 pt-2">
                                        <p className="font-semibold text-slate-900">{profile.full_name || profile.company_name}</p>
                                        <p className="text-xs text-slate-500">{profile.company_email || "Freelancer"}</p>
                                        <p className="text-xs text-slate-500 mt-1">Authorized Representative</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Sticky Details Sidebar */}
                <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6 lg:sticky lg:top-8 self-start">

                    {/* Status Badge & Actions Card */}
                    <Card className="border-0 shadow-md ring-1 ring-slate-200/50 bg-white/50 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wider">Document Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`p-4 rounded-xl flex items-center gap-3 w-full border
                                ${contract.status === 'Signed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    contract.status === 'Sent' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                        'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0
                                    ${contract.status === 'Signed' ? 'bg-emerald-200/50 text-emerald-700' :
                                        contract.status === 'Sent' ? 'bg-blue-200/50 text-blue-700' :
                                            'bg-amber-200/50 text-amber-700'}`}>
                                    {contract.status === 'Signed' && <CheckCircle className="h-5 w-5" />}
                                    {contract.status === 'Sent' && <Send className="h-5 w-5" />}
                                    {contract.status === 'Draft' && <PenTool className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="font-bold whitespace-nowrap">{contract.status}</p>
                                    <p className="text-xs opacity-80">
                                        {contract.status === 'Signed' ? 'Fully legally binding.' :
                                            contract.status === 'Sent' ? 'Awaiting client action.' :
                                                'Needs to be sent.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="border-0 shadow-md ring-1 ring-slate-200/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-brand-primary" />
                                Contract Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="relative border-l border-slate-200 ml-3 space-y-6">
                                {timeline.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={index} className="relative pl-6">
                                            <div className={`absolute -left-[14px] top-1 h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-white
                                                ${step.completed ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.completed && step.date && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                )}
                                                {!step.completed && (
                                                    <p className="text-xs text-slate-400 mt-1 italic">Pending</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    {(contract.client || contract.project) && (
                        <Card className="border-0 shadow-md ring-1 ring-slate-200/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-brand-primary" />
                                    Associations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                {contract.client && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                                            <User className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</p>
                                            <Link href={`/clients/${contract.client_id}`} className="text-sm font-medium text-slate-900 hover:text-brand-primary transition-colors">
                                                {contract.client.name}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                {contract.project && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</p>
                                            <Link href={`/projects/${contract.project_id}`} className="text-sm font-medium text-slate-900 hover:text-brand-primary transition-colors">
                                                {contract.project.title}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Signature Meta Info for Extra Security Transparency */}
                    {contract.status === 'Signed' && contract.signer_ip && (
                        <Card className="border border-emerald-100 bg-emerald-50/30 shadow-none">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Security Meta</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="space-y-1">
                                        <p className="text-emerald-700/70 font-semibold flex items-center gap-1"><User className="h-3 w-3" /> Signer Email</p>
                                        <p className="text-emerald-900 truncate" title={contract.signer_email!}>{contract.signer_email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-emerald-700/70 font-semibold flex items-center gap-1"><Globe className="h-3 w-3" /> Timestamp</p>
                                        <p className="text-emerald-900">{format(new Date(contract.signed_at!), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2 pt-2 border-t border-emerald-100">
                                        <p className="text-emerald-700/70 font-semibold flex items-center gap-1"><Monitor className="h-3 w-3" /> IP Address</p>
                                        <p className="text-emerald-900 font-mono">{contract.signer_ip}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
