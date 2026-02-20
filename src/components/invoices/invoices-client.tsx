"use client";

import { useState, useMemo } from "react";
import { Invoice } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    FileText, Search, Plus, Filter, LayoutGrid, List,
    DollarSign, CheckCircle2, Clock, AlertCircle, Calendar,
    History, MoreVertical, ExternalLink, Download
} from "lucide-react";
import Link from "next/link";
import { format, isPast, parseISO } from "date-fns";

interface InvoicesClientProps {
    invoices: any[];
}

const statusConfig: Record<string, { color: string; icon: any }> = {
    Paid: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    Sent: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
    Overdue: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    Draft: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400", icon: FileText },
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export function InvoicesClient({ invoices }: InvoicesClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch = !search ||
                invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                invoice.client?.name?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, search, statusFilter]);

    const stats = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        const paid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        const overdue = invoices.filter(inv => inv.status === 'Overdue' || (inv.status === 'Sent' && inv.due_date && isPast(parseISO(inv.due_date)))).reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        const pending = total - paid;

        return { total, paid, overdue, pending };
    }, [invoices]);

    const statuses = ["All", "Paid", "Sent", "Overdue", "Draft"];

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Invoices
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage your billing and track payments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                        <Link href="/invoices/history">
                            <History className="mr-2 h-4 w-4" /> History
                        </Link>
                    </Button>
                    <Button size="sm" asChild className="bg-brand-primary hover:bg-brand-primary/90">
                        <Link href="/invoices/new">
                            <Plus className="mr-2 h-4 w-4" /> Create Invoice
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.total)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Paid</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.paid)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                                <p className="text-lg font-bold">{formatCurrency(stats.pending)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                                <p className="text-lg font-bold text-red-500">{formatCurrency(stats.overdue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2 w-full sm:max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice # or client..."
                            className="pl-9 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        {statuses.map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "ghost"}
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => setStatusFilter(status)}
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                    <div className="h-7 w-[1px] bg-border mx-1 hidden sm:block" />
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredInvoices.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="font-semibold text-lg">No invoices found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            {search || statusFilter !== "All"
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "You haven't created any invoices yet. Start by creating your first one."}
                        </p>
                        {!(search || statusFilter !== "All") && (
                            <Button asChild className="mt-4" variant="outline">
                                <Link href="/invoices/new">Create Invoice</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredInvoices.map((invoice) => {
                        const config = statusConfig[invoice.status] || statusConfig.Draft;
                        const isOverdue = invoice.status === 'Sent' && invoice.due_date && isPast(parseISO(invoice.due_date));

                        return (
                            <Card key={invoice.id} className="group hover:shadow-md transition-all duration-200 hover:border-brand-primary/30 flex flex-col">
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="font-semibold text-sm group-hover:text-brand-primary transition-colors">
                                                {invoice.invoice_number}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Issued {format(parseISO(invoice.issue_date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] uppercase tracking-wider ${isOverdue ? statusConfig.Overdue.color : config.color}`} variant="secondary">
                                            {isOverdue ? "Overdue" : invoice.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Client</p>
                                            <p className="text-sm font-medium truncate">{invoice.client?.name || "No Client"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                                                <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                                    {invoice.due_date ? format(parseISO(invoice.due_date), "MMM d, yyyy") : "No due date"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                        <div className="text-lg font-bold">
                                            {formatCurrency(invoice.total)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`/invoices/${invoice.invoice_number}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <Card className="overflow-hidden border-none shadow-sm rounded-xl bg-card">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead>
                                <tr className="border-b bg-muted/20">
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Invoice</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Client</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Issued</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Due Date</th>
                                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredInvoices.map((invoice) => {
                                    const config = statusConfig[invoice.status] || statusConfig.Draft;
                                    const isOverdue = invoice.status === 'Sent' && invoice.due_date && isPast(parseISO(invoice.due_date));

                                    return (
                                        <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/30 group">
                                            <td className="p-4 align-middle">
                                                <Link href={`/invoices/${invoice.invoice_number}`} className="font-semibold text-brand-primary hover:underline">
                                                    {invoice.invoice_number}
                                                </Link>
                                            </td>
                                            <td className="p-4 align-middle font-medium">
                                                {invoice.client?.name || "—"}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {format(parseISO(invoice.issue_date), "MMM d, yyyy")}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                                    {invoice.due_date ? format(parseISO(invoice.due_date), "MMM d, yyyy") : "—"}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold text-base">
                                                {formatCurrency(invoice.total)}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <Badge className={`text-[10px] uppercase tracking-wider ${isOverdue ? statusConfig.Overdue.color : config.color}`} variant="secondary">
                                                    {isOverdue ? "Overdue" : invoice.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                        <Link href={`/invoices/${invoice.invoice_number}`}>
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
