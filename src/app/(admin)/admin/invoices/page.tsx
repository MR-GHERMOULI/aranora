import { createClient } from "@/lib/supabase/server"
import { FileText, DollarSign } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { InvoicesTable } from "./invoices-table"

export default async function AdminInvoicesPage() {
    const supabase = await createClient()

    // Fetch all invoices with client and user info
    const { data: invoices } = await supabase
        .from("invoices")
        .select(`
            id,
            invoice_number,
            status,
            total,
            issue_date,
            due_date,
            created_at,
            user_id,
            profiles:user_id (full_name),
            clients:client_id (name)
        `)
        .order("created_at", { ascending: false })

    // Get stats
    const [
        { count: totalInvoices },
        { count: paidInvoices },
        { count: pendingInvoices },
        { data: revenueData },
    ] = await Promise.all([
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Paid"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).in("status", ["Draft", "Sent"]),
        supabase.from("invoices").select("total").eq("status", "Paid"),
    ])

    const totalRevenue = (revenueData || []).reduce((sum, inv) => sum + (inv.total || 0), 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoices Overview</h1>
                <p className="text-muted-foreground mt-1">
                    View all invoices generated across the platform
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <StatsCard
                    title="Total Invoices"
                    value={totalInvoices || 0}
                    icon={FileText}
                />
                <StatsCard
                    title="Paid"
                    value={paidInvoices || 0}
                    icon={FileText}
                    description={`${totalInvoices ? Math.round(((paidInvoices || 0) / totalInvoices) * 100) : 0}% rate`}
                />
                <StatsCard
                    title="Pending"
                    value={pendingInvoices || 0}
                    icon={FileText}
                    description="draft or sent"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    description="from paid invoices"
                />
            </div>

            {/* Invoices Table */}
            <InvoicesTable invoices={invoices || []} />
        </div>
    )
}
