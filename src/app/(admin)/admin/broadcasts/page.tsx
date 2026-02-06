import { createClient } from "@/lib/supabase/server"
import { Radio } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { BroadcastsClient } from "./broadcasts-client"

export default async function AdminBroadcastsPage() {
    const supabase = await createClient()

    // Fetch broadcasts
    const { data: broadcasts } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false })

    // Total sent count (sum of sent_count)
    const totalSent = (broadcasts || []).reduce((sum, b) => sum + (b.sent_count || 0), 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Broadcasts</h1>
                <p className="text-muted-foreground mt-1">
                    Send announcements and notifications to all users
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
                <StatsCard
                    title="Total Broadcasts"
                    value={broadcasts?.length || 0}
                    icon={Radio}
                />
                <StatsCard
                    title="Total Messages Sent"
                    value={totalSent}
                    icon={Radio}
                    description="to stats users"
                />
            </div>

            {/* Client Component */}
            <BroadcastsClient initialBroadcasts={broadcasts || []} />
        </div>
    )
}
