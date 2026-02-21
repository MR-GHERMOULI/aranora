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

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Signed': return {
                bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                iconBg: 'bg-emerald-500/20 text-emerald-700',
                Icon: CheckCircle,
                desc: 'Fully legally binding.'
            };
            case 'Sent': return {
                bg: 'bg-blue-50 border-blue-200 text-blue-800',
                iconBg: 'bg-blue-500/20 text-blue-700',
                Icon: Send,
                desc: 'Awaiting client action.'
            };
            default: return {
                bg: 'bg-amber-50 border-amber-200 text-amber-800',
                iconBg: 'bg-amber-500/20 text-amber-700',
                Icon: PenTool,
                desc: 'Needs to be sent.'
            };
        }
    };

    const statusStyle = getStatusStyles(contract.status);
    const StatusIcon = statusStyle.Icon;

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8 pt-8 pb-24">
            {/* ── Top Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 group" asChild>
                    <Link href="/contracts">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
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

                {/* ── Left Side: Document Viewer ── */}
                <div className="flex-1 w-full flex flex-col items-center">
                    <div className="w-full max-w-4xl bg-white border border-slate-200 shadow-xl rounded-2xl p-10 sm:p-16 lg:p-24 min-h-[1056px] relative overflow-hidden">
                        {/* Decorative top binder edge */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-indigo-500 to-blue-500"></div>

                        {/* Title and Badge */}
                        <div className="border-b-2 border-slate-900 pb-8 mb-12 flex justify-between items-end gap-8">
                            <h1 className="text-3xl md:text-5xl font-serif text-slate-900 tracking-tight leading-tight max-w-[80%]">
                                {contract.title}
                            </h1>
                            {contract.status === 'Signed' && (
                                <div className="flex flex-col items-center space-y-1.5 opacity-90 rotate-[-5deg] mb-4 shrink-0">
                                    <div className="px-4 py-1.5 border-[3px] border-emerald-600 rounded-lg text-emerald-600 font-bold uppercase tracking-widest text-sm shadow-sm bg-emerald-50/50 backdrop-blur-sm">
                                        Fully Executed
                                    </div>
                                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 rounded-full">
                                        {format(new Date(contract.signed_at!), 'MM/dd/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actual Contract Content */}
                        <div className="prose prose-slate prose-headings:font-serif prose-p:font-serif max-w-none text-slate-800 leading-loose prose-a:text-brand-primary whitespace-pre-wrap text-[15px]">
                            {contract.content}
                        </div>

                        {/* Signature Block */}
                        {contract.status === 'Signed' && contract.signature_data && (
                            <div className="mt-28 md:mt-36 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Client Signature</p>
                                    <div className="h-28 w-full flex items-end justify-start mb-3 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                        <img src={contract.signature_data} alt="Signature" className="max-h-full max-w-full" />
                                    </div>
                                    <div className="border-t-2 border-slate-800 pt-3">
                                        <p className="font-bold text-slate-900 text-lg">{contract.signer_name}</p>
                                        <p className="text-sm text-slate-500">{contract.signer_email}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono">
                                            <Shield className="h-3 w-3" />
                                            Signed {format(new Date(contract.signed_at!), 'MMM d, yyyy HH:mm')}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Service Provider</p>
                                    <div className="h-28 w-full flex items-end justify-start mb-3 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                        <div className="font-[Signature-Font] italic text-4xl text-slate-800 opacity-80 pb-2">
                                            {profile.full_name || profile.company_name}
                                        </div>
                                    </div>
                                    <div className="border-t-2 border-slate-800 pt-3">
                                        <p className="font-bold text-slate-900 text-lg">{profile.full_name || profile.company_name}</p>
                                        <p className="text-sm text-slate-500">{profile.company_email || "Freelancer"}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                            Authorized Rep.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Side: Sticky Details Sidebar ── */}
                <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6 lg:sticky lg:top-8 self-start">

                    {/* Status Badge Card */}
                    <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="text-xs text-slate-400 font-bold uppercase tracking-widest">Document Status</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-5">
                            <div className={`p-4 rounded-xl flex items-center gap-4 w-full border ${statusStyle.bg}`}>
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${statusStyle.iconBg}`}>
                                    <StatusIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight">{contract.status}</p>
                                    <p className="text-xs font-medium opacity-80 mt-0.5">
                                        {statusStyle.desc}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline Card */}
                    <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-brand-primary to-blue-500" />
                        <CardHeader className="pb-2 pt-5">
                            <CardTitle className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-brand-primary" />
                                Contract Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 pb-6">
                            <div className="relative border-l-2 border-slate-100 ml-4 space-y-7">
                                {timeline.map((step, index) => {
                                    const Icon = step.icon;
                                    const isLastCompleted = step.completed && (index === timeline.length - 1 || !timeline[index + 1].completed);

                                    return (
                                        <div key={index} className="relative pl-6">
                                            <div className={`absolute -left-[17px] top-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white
                                                ${step.completed ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-100 text-slate-300'}
                                                ${isLastCompleted ? 'ring-brand-primary/20 scale-110' : ''} transition-all`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className={`${isLastCompleted ? '-mt-0.5' : 'mt-1'}`}>
                                                <p className={`text-sm font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.completed && step.date && (
                                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                                        {format(new Date(step.date), 'MMM d, yyyy • h:mm a')}
                                                    </p>
                                                )}
                                                {!step.completed && (
                                                    <p className="text-xs text-amber-500 mt-1 font-medium">Pending action</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associations Card */}
                    {(contract.client || contract.project) && (
                        <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                            <CardHeader className="pb-2 pt-5">
                                <CardTitle className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                                    Associations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4 pb-5">
                                {contract.client && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 shrink-0 group-hover:bg-violet-100 transition-colors">
                                            <User className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Client</p>
                                            <Link href={`/clients/${contract.client_id}`} className="text-sm font-semibold text-slate-900 hover:text-violet-600 transition-colors">
                                                {contract.client.name}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                {contract.project && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 group-hover:bg-blue-100 transition-colors">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Project</p>
                                            <Link href={`/projects/${contract.project_id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                                                {contract.project.title}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Meta Info */}
                    {contract.status === 'Signed' && contract.signer_ip && (
                        <Card className="border border-emerald-100 bg-emerald-50/50 shadow-none relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Shield className="h-24 w-24" />
                            </div>
                            <CardContent className="p-5 space-y-4 relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Security Metadata</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs bg-white/60 p-3 rounded-xl border border-emerald-100/50 backdrop-blur-sm">
                                    <div className="space-y-1">
                                        <p className="text-emerald-700/60 font-bold flex items-center gap-1.5"><User className="h-3 w-3" /> Signer Email</p>
                                        <p className="text-emerald-950 font-medium truncate" title={contract.signer_email!}>{contract.signer_email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-emerald-700/60 font-bold flex items-center gap-1.5"><Globe className="h-3 w-3" /> Timestamp</p>
                                        <p className="text-emerald-950 font-medium whitespace-nowrap">{format(new Date(contract.signed_at!), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2 pt-3 border-t border-emerald-100/50">
                                        <p className="text-emerald-700/60 font-bold flex items-center gap-1.5"><Monitor className="h-3 w-3" /> IP Address Tracker</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-emerald-950 font-mono font-medium">{contract.signer_ip}</p>
                                            <span className="px-2 py-0.5 bg-emerald-100 rounded text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Verified</span>
                                        </div>
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
