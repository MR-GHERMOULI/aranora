import { getContracts, getTemplates } from "./actions";
import { getClients } from "../clients/actions";
import { getProjects } from "../projects/actions";
import { getProfile } from "../settings/actions";
import { SmartContractWizard } from "@/components/contracts/smart-contract-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText, User, CheckCircle, Send, Clock, LayoutTemplate,
    MoreHorizontal, ArrowRight, Activity, DollarSign, FileSignature,
    TrendingUp, Sparkles, Dot
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
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

    const signedCount = contracts.filter(c => c.status === 'Signed').length;
    const pendingCount = contracts.filter(c => c.status === 'Sent').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;

    let totalSignedValue = 0;
    contracts.forEach(c => {
        if (c.status === 'Signed' && c.contract_data && typeof c.contract_data === 'object' && 'total_amount' in c.contract_data) {
            totalSignedValue += Number((c.contract_data as any).total_amount) || 0;
        }
    });

    const metrics = [
        {
            label: "Signed Value",
            value: `$${totalSignedValue.toLocaleString()}`,
            sub: "Lifetime secured",
            icon: DollarSign,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            accent: "from-emerald-500/20 to-transparent",
            border: "border-emerald-100",
        },
        {
            label: "Signed",
            value: signedCount,
            sub: "Completed agreements",
            icon: CheckCircle,
            iconBg: "bg-violet-500/10",
            iconColor: "text-violet-600",
            accent: "from-violet-500/20 to-transparent",
            border: "border-violet-100",
        },
        {
            label: "Awaiting Signature",
            value: pendingCount,
            sub: "Pending client action",
            icon: Send,
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
            accent: "from-blue-500/20 to-transparent",
            border: "border-blue-100",
        },
        {
            label: "Drafts",
            value: draftCount,
            sub: "In preparation",
            icon: Clock,
            iconBg: "bg-slate-400/10",
            iconColor: "text-slate-500",
            accent: "from-slate-300/20 to-transparent",
            border: "border-slate-100",
        },
    ];

    return (
        <div className="px-4 lg:px-8 space-y-8 pt-8 pb-16 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center ring-1 ring-brand-primary/20 shrink-0">
                        <FileSignature className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Contracts
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Create, send, and track professional legal agreements.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium gap-2 transition-all"
                        asChild
                    >
                        <Link href="/contracts/templates">
                            <LayoutTemplate className="h-4 w-4 text-slate-400" />
                            Templates
                            {templates.length > 0 && (
                                <span className="ml-1 h-5 min-w-5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold flex items-center justify-center px-1">
                                    {templates.length}
                                </span>
                            )}
                        </Link>
                    </Button>

                    {/* Glowing CTA */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
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

            {/* ── Metric Cards ── */}
            {contracts.length > 0 && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {metrics.map((m, i) => {
                        const Icon = m.icon;
                        return (
                            <Card
                                key={i}
                                className={`relative overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${m.border}`}
                            >
                                {/* Gradient accent */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.accent}`} />

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {m.label}
                                    </CardTitle>
                                    <div className={`h-8 w-8 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                                        <Icon className={`h-4 w-4 ${m.iconColor}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-5">
                                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                                        {m.value}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">{m.sub}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Contracts Table / Empty State ── */}
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">

                {contracts.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-28 text-center px-6">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-2xl scale-150" />
                            <div className="relative h-24 w-24 bg-white rounded-3xl shadow-lg flex items-center justify-center ring-1 ring-brand-primary/10">
                                <FileSignature className="h-11 w-11 text-brand-primary/70" />
                                <div className="absolute -top-1 -right-1 h-6 w-6 bg-brand-primary rounded-full flex items-center justify-center shadow">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No contracts yet</h3>
                        <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
                            Create professional, legally-binding contracts in minutes using the Smart Contract Assistant.
                        </p>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-blue-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
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
                ) : (
                    /* ── Table ── */
                    <>
                        {/* Table header strip */}
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-brand-primary/60" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    All Contracts
                                </span>
                                <span className="ml-1 h-5 min-w-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center px-1">
                                    {contracts.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                                        <TableHead className="font-semibold text-slate-600 h-11 text-xs uppercase tracking-wider pl-5">
                                            Contract
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-600 h-11 text-xs uppercase tracking-wider">
                                            Client
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-600 h-11 text-xs uppercase tracking-wider">
                                            Status
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-600 h-11 text-xs uppercase tracking-wider">
                                            Date
                                        </TableHead>
                                        <TableHead className="text-right font-semibold text-slate-600 h-11 text-xs uppercase tracking-wider pr-5">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contracts.map((contract) => {
                                        const statusConfig = {
                                            Signed: {
                                                dot: "bg-emerald-500",
                                                badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
                                                icon: CheckCircle,
                                            },
                                            Sent: {
                                                dot: "bg-blue-500",
                                                badge: "bg-blue-50 text-blue-700 border border-blue-200/60",
                                                icon: Send,
                                            },
                                            Draft: {
                                                dot: "bg-amber-400",
                                                badge: "bg-amber-50 text-amber-700 border border-amber-200/60",
                                                icon: Clock,
                                            },
                                        }[contract.status as 'Signed' | 'Sent' | 'Draft'] ?? {
                                            dot: "bg-slate-400",
                                            badge: "bg-slate-100 text-slate-700 border border-slate-200",
                                            icon: Clock,
                                        };
                                        const StatusIcon = statusConfig.icon;

                                        // Client initials
                                        const clientInitials = contract.client?.name
                                            ? contract.client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                                            : null;

                                        return (
                                            <TableRow
                                                key={contract.id}
                                                className="group hover:bg-slate-50/70 transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                {/* Contract Name */}
                                                <TableCell className="font-medium text-slate-900 py-3.5 pl-5">
                                                    <Link
                                                        href={`/contracts/${contract.id}`}
                                                        className="flex items-center gap-3 group/link"
                                                    >
                                                        <div className="h-9 w-9 rounded-xl bg-brand-primary/5 flex items-center justify-center border border-brand-primary/10 shrink-0 group-hover/link:bg-brand-primary/10 transition-colors">
                                                            <FileText className="h-4 w-4 text-brand-primary/60 group-hover/link:text-brand-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-800 group-hover/link:text-brand-primary transition-colors line-clamp-1">
                                                                {contract.title}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                Contract Agreement
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </TableCell>

                                                {/* Client */}
                                                <TableCell className="py-3.5">
                                                    {contract.client ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm">
                                                                {clientInitials ?? <User className="h-3 w-3" />}
                                                            </div>
                                                            <span className="text-sm text-slate-700 font-medium">
                                                                {contract.client.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-300 italic">No client</span>
                                                    )}
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell className="py-3.5">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.badge}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`} />
                                                        {contract.status}
                                                    </div>
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell className="py-3.5">
                                                    <div>
                                                        <span className="text-sm text-slate-700 font-medium">
                                                            {format(new Date(contract.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right py-3.5 pr-5">
                                                    {/* Desktop: View button on hover */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-primary/8 hover:text-brand-primary font-medium text-slate-600 h-8"
                                                    >
                                                        <Link href={`/contracts/${contract.id}`}>
                                                            View
                                                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    {/* Mobile: dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden text-slate-400">
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
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
