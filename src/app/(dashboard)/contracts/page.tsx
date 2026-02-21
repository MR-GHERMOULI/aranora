import { getContracts, getTemplates } from "./actions";
import { getClients } from "../clients/actions";
import { getProjects } from "../projects/actions";
import { getProfile } from "../settings/actions";
import { SmartContractWizard } from "@/components/contracts/smart-contract-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, User, CheckCircle, Send, Clock, LayoutTemplate, MoreHorizontal, ArrowRight, Activity, DollarSign, FileSignature } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default async function ContractsPage() {
    const [contracts, clients, projects, templates, profile] = await Promise.all([
        getContracts(),
        getClients(),
        getProjects(),
        getTemplates(),
        getProfile()
    ]);

    // Calculate metrics
    const signedCount = contracts.filter(c => c.status === 'Signed').length;
    const pendingCount = contracts.filter(c => c.status === 'Sent').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;

    let totalSignedValue = 0;
    contracts.forEach(c => {
        if (c.status === 'Signed' && c.contract_data && typeof c.contract_data === 'object' && 'total_amount' in c.contract_data) {
            totalSignedValue += Number((c.contract_data as any).total_amount) || 0;
        }
    });

    return (
        <div className="px-4 lg:px-8 space-y-8 pt-8 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <FileSignature className="h-8 w-8 text-brand-primary" />
                        Contracts
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create, send, and track professional legal agreements.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 border-slate-200 bg-white hover:bg-slate-50" asChild>
                        <Link href="/contracts/templates">
                            <LayoutTemplate className="mr-2 h-4 w-4 text-slate-500" />
                            Templates
                        </Link>
                    </Button>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative">
                            <SmartContractWizard
                                clients={clients}
                                projects={projects}
                                templates={templates}
                                freelancerName={profile.full_name || profile.company_name || "Freelancer"}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            {contracts.length > 0 && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Signed Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">${totalSignedValue.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                                <Activity className="h-3 w-3 mr-1" /> Lifetime
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Signed Contracts</CardTitle>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{signedCount}</div>
                            <p className="text-xs text-slate-500 mt-1">Completed agreements</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Pending Signatures</CardTitle>
                            <Send className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
                            <p className="text-xs text-slate-500 mt-1">Awaiting client action</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Drafts</CardTitle>
                            <Clock className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{draftCount}</div>
                            <p className="text-xs text-slate-500 mt-1">In preparation</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Content List */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                {contracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <div className="h-20 w-20 bg-brand-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-brand-primary/5">
                            <FileSignature className="h-10 w-10 text-brand-primary/60" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No contracts yet</h3>
                        <p className="text-slate-500 max-w-sm mb-6">
                            Create professional, legally-binding contracts in minutes.
                        </p>
                        <SmartContractWizard
                            clients={clients}
                            projects={projects}
                            templates={templates}
                            freelancerName={profile.full_name || profile.company_name || "Freelancer"}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                <TableRow className="hover:bg-slate-50/80">
                                    <TableHead className="font-semibold text-slate-700 h-11">Contract Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-11">Client</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-11">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-11">Created</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 h-11">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contracts.map((contract) => (
                                    <TableRow key={contract.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="font-medium text-slate-900 py-3">
                                            <Link href={`/contracts/${contract.id}`} className="hover:text-brand-primary transition-colors flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400 group-hover:text-brand-primary transition-colors" />
                                                {contract.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {contract.client ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <User className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <span className="text-sm text-slate-600 font-medium">{contract.client.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">No client</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm
                                                ${contract.status === 'Signed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                                                    contract.status === 'Sent' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                                                        'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                {contract.status === 'Signed' && <CheckCircle className="h-3 w-3" />}
                                                {contract.status === 'Sent' && <Send className="h-3 w-3" />}
                                                {contract.status === 'Draft' && <Clock className="h-3 w-3" />}
                                                {contract.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 py-3 font-medium">
                                            {format(new Date(contract.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right py-3">
                                            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-primary/10 hover:text-brand-primary font-medium">
                                                <Link href={`/contracts/${contract.id}`}>
                                                    View Details
                                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/contracts/${contract.id}`}>View Details</Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}
