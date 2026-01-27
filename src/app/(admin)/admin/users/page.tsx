import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import { UsersTable } from "@/components/admin/users-table"
import { StatsCard } from "@/components/admin/stats-card"

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Fetch all users with their profiles
    const { data: users } = await supabase
        .from("profiles")
        .select("id, username, full_name, company_email, country, account_status, created_at")
        .order("created_at", { ascending: false })

    // Get stats
    const [
        { count: totalUsers },
        { count: activeUsers },
        { count: suspendedUsers },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
    ])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage all registered users on the platform
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                    title="Total Users"
                    value={totalUsers || 0}
                    icon={Users}
                />
                <StatsCard
                    title="Active Users"
                    value={activeUsers || 0}
                    icon={Users}
                    description="currently active"
                />
                <StatsCard
                    title="Suspended"
                    value={suspendedUsers || 0}
                    icon={Users}
                    description="accounts suspended"
                />
            </div>

            {/* Users Table */}
            <UsersTable initialUsers={users || []} />
        </div>
    )
}
