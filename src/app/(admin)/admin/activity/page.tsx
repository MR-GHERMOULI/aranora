import { createClient } from "@/lib/supabase/server"
import { Activity } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { ActivityLogTable } from "./activity-table"

export default async function AdminActivityPage() {
    const supabase = await createClient()

    // Fetch activity logs
    const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

    // Get stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayLogs = logs?.filter((l) => new Date(l.created_at) >= today).length || 0
    const weekLogs = logs?.filter((l) => new Date(l.created_at) >= thisWeek).length || 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground mt-1">
                    Track all administrative actions on the platform
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                    title="Total Actions"
                    value={logs?.length || 0}
                    icon={Activity}
                    description="all time"
                />
                <StatsCard
                    title="Today"
                    value={todayLogs}
                    icon={Activity}
                    description="actions today"
                />
                <StatsCard
                    title="This Week"
                    value={weekLogs}
                    icon={Activity}
                    description="last 7 days"
                />
            </div>

            {/* Activity Table */}
            <ActivityLogTable logs={logs || []} />
        </div>
    )
}
