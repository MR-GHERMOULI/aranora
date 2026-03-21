import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/admin/stats-card"

export default async function AdminProjectsPage() {
    const supabase = await createClient()

    // Fetch aggregated stats only — no individual project data
    const [
        { count: totalProjects },
        { count: activeProjects },
        { count: completedProjects },
        { count: planningProjects },
        { count: onHoldProjects },
        { count: cancelledProjects },
        { data: budgetData },
        { data: recentActivity },
    ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "In Progress"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "Completed"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "Planning"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "On Hold"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "Cancelled"),
        supabase.from("projects").select("budget"),
        // Projects created in the last 30 days
        supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const totalBudget = (budgetData || []).reduce((sum: number, p: { budget?: number }) => sum + (p.budget || 0), 0)
    const total = totalProjects || 0
    const recentCount = (recentActivity as unknown as { count: number } | null)?.count ?? 0

    const statuses = [
        { label: "In Progress", count: activeProjects || 0, color: "bg-yellow-500" },
        { label: "Planning", count: planningProjects || 0, color: "bg-blue-500" },
        { label: "Completed", count: completedProjects || 0, color: "bg-green-500" },
        { label: "On Hold", count: onHoldProjects || 0, color: "bg-orange-500" },
        { label: "Cancelled", count: cancelledProjects || 0, color: "bg-red-500" },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Live platform statistics — individual project data is private
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Projects"
                    value={total}
                    iconName="Briefcase"
                    description="all time"
                />
                <StatsCard
                    title="Active"
                    value={activeProjects || 0}
                    iconName="Briefcase"
                    description="in progress"
                />
                <StatsCard
                    title="Completed"
                    value={completedProjects || 0}
                    iconName="Briefcase"
                    description="finished"
                />
                <StatsCard
                    title="Total Budget"
                    value={`$${totalBudget.toLocaleString()}`}
                    iconName="Briefcase"
                    description="across all projects"
                />
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border bg-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Status Breakdown</h2>
                    <span className="text-sm text-muted-foreground">{recentCount} new in last 30 days</span>
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

                {/* Completion rate highlight */}
                <div className="pt-4 border-t flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {total > 0 ? Math.round(((completedProjects || 0) / total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Completion rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                            {total > 0 ? Math.round(((activeProjects || 0) / total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Active rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {total > 0 ? Math.round(((planningProjects || 0) / total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">In planning</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">
                            {total > 0 ? `$${Math.round(totalBudget / total).toLocaleString()}` : "$0"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Avg budget / project</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
