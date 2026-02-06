"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Invoice {
    id: string
    invoice_number: string
    status: string
    total: number
    issue_date: string | null
    due_date: string | null
    created_at: string
    user_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clients: any
}

interface InvoicesTableProps {
    invoices: Invoice[]
}

// Helper to extract nested value (handles both array and object from Supabase)
function getNestedValue(obj: unknown, key: string): string | null {
    if (!obj) return null
    if (Array.isArray(obj)) {
        return obj[0]?.[key] ?? null
    }
    return (obj as Record<string, unknown>)[key] as string | null
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    const filteredInvoices = invoices.filter((invoice) => {
        const profileName = getNestedValue(invoice.profiles, "full_name")
        const clientName = getNestedValue(invoice.clients, "name")

        const matchesSearch =
            invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            clientName?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            "Draft": "bg-gray-500/10 text-gray-600",
            "Sent": "bg-blue-500/10 text-blue-600",
            "Paid": "bg-green-500/10 text-green-600",
            "Overdue": "bg-red-500/10 text-red-600",
            "Cancelled": "bg-orange-500/10 text-orange-600",
        }
        return <Badge className={styles[status] || "bg-gray-500/10 text-gray-600"}>{status}</Badge>
    }

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by invoice #, client, or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Status: {statusFilter === "all" ? "All" : statusFilter}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Draft")}>Draft</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Sent")}>Sent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Paid")}>Paid</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Overdue")}>Overdue</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-medium">{invoice.invoice_number}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {getNestedValue(invoice.clients, "name") || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {getNestedValue(invoice.profiles, "full_name") || "Unknown"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            ${invoice.total?.toLocaleString() || "0"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
        </>
    )
}
