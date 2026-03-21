import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/admin/stats-card"

export default async function AdminInvoicesPage() {
    const supabase = await createClient()

    // Fetch aggregated stats only — no individual invoice data
    const [
        { count: totalInvoices },
        { count: paidInvoices },
        { count: sentInvoices },
        { count: draftInvoices },
        { count: overdueInvoices },
        { count: cancelledInvoices },
        { data: revenueData },
        { data: allTotals },
        { count: recentCount },
    ] = await Promise.all([
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Paid"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Sent"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Draft"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Overdue"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Cancelled"),
        supabase.from("invoices").select("total").eq("status", "Paid"),
        supabase.from("invoices").select("total"),
        supabase
            .from("invoices")
            .select("*", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const totalRevenue = (revenueData || []).reduce((sum: number, inv: { total?: number }) => sum + (inv.total || 0), 0)
    const totalValue = (allTotals || []).reduce((sum: number, inv: { total?: number }) => sum + (inv.total || 0), 0)
    const total = totalInvoices || 0
    const avgInvoiceValue = total > 0 ? Math.round(totalValue / total) : 0
    const paymentRate = total > 0 ? Math.round(((paidInvoices || 0) / total) * 100) : 0

    const statuses = [
        { label: "Paid", count: paidInvoices || 0, color: "bg-green-500" },
        { label: "Sent", count: sentInvoices || 0, color: "bg-blue-500" },
        { label: "Draft", count: draftInvoices || 0, color: "bg-gray-400" },
        { label: "Overdue", count: overdueInvoices || 0, color: "bg-red-500" },
        { label: "Cancelled", count: cancelledInvoices || 0, color: "bg-orange-500" },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoices Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Live platform statistics — individual invoice data is private
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Invoices"
                    value={total}
                    iconName="FileText"
                    description="all time"
                />
                <StatsCard
                    title="Paid"
                    value={paidInvoices || 0}
                    iconName="FileText"
                    description={`${paymentRate}% payment rate`}
                />
                <StatsCard
                    title="Overdue"
                    value={overdueInvoices || 0}
                    iconName="FileText"
                    description="require attention"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    iconName="DollarSign"
                    description="from paid invoices"
                />
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border bg-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Status Breakdown</h2>
                    <span className="text-sm text-muted-foreground">{recentCount ?? 0} new in last 30 days</span>
                </div>

                {/* Visual progress bars */}
                <div className="space-y-4">
                    {statuses.map(({ label, count, color }) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{label}</span>
                                    <span className="text-muted-foreground">
                                        {count} &nbsp;·&nbsp; {pct}%
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${color}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* KPI highlights */}
                <div className="pt-4 border-t flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{paymentRate}%</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Payment rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {total > 0 ? Math.round(((overdueInvoices || 0) / total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Overdue rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">${avgInvoiceValue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Avg invoice value</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Collected revenue</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
