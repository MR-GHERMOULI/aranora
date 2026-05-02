import { createAdminClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/admin/users-table"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"

export default async function AdminUsersPage() {
    const supabaseAdmin = createAdminClient()

    // Fetch all users with their profiles (including subscription data)
    const { data: usersData } = await supabaseAdmin
        .from("profiles")
        .select("id, username, full_name, company_email, phone, country, account_status, created_at, is_admin, subscription_status, trial_ends_at")
        .order("created_at", { ascending: false })

    // Fetch auth users to get missing emails
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()

    // Fetch promo invite links to identify promo users
    const { data: promoLinks } = await supabaseAdmin
        .from("promo_invite_links")
        .select("used_by, free_months, code")

    // Build a map of promo users: userId -> { free_months, code }
    const promoUserMap: Record<string, { free_months: number; code: string }> = {}
    if (promoLinks) {
        promoLinks.forEach(link => {
            if (link.used_by) {
                promoUserMap[link.used_by] = {
                    free_months: link.free_months,
                    code: link.code,
                }
            }
        })
    }

    // Fetch billing subscriptions to identify paid users
    const { data: billingSubscriptions } = await supabaseAdmin
        .from("billing_subscriptions")
        .select("user_id, status, plan_type, current_period_end")
        .in("status", ["active", "trialing"])

    // Build a map of billing subscriptions: userId -> subscription
    const billingMap: Record<string, { status: string; plan_type: string; current_period_end: string | null }> = {}
    let monthlyActive = 0
    let yearlyActive = 0
    let duplicateSubscriptions = 0
    const seenUsers = new Set<string>()

    if (billingSubscriptions) {
        billingSubscriptions.forEach(sub => {
            if (sub.status === 'active' || sub.status === 'trialing') {
                if (seenUsers.has(sub.user_id)) {
                    duplicateSubscriptions++
                }
                seenUsers.add(sub.user_id)
                
                if (sub.status === 'active') {
                    if (sub.plan_type === 'monthly') monthlyActive++
                    else if (sub.plan_type === 'yearly') yearlyActive++
                }
            }

            // Always keep the latest one for the table map
            billingMap[sub.user_id] = {
                status: sub.status,
                plan_type: sub.plan_type,
                current_period_end: sub.current_period_end,
            }
        })
    }

    // Merge all data together
    const users = (usersData || []).map(profile => {
        const authUser = authData?.users?.find(u => u.id === profile.id)
        const promoInfo = promoUserMap[profile.id] || null
        const billingInfo = billingMap[profile.id] || null

        // Determine user tier
        let tier: "owner" | "paid" | "promo" | "trial" | "expired" = "trial"

        if (profile.is_admin) {
            tier = "owner"
        } else if (billingInfo && billingInfo.status === "active") {
            tier = "paid"
        } else if (promoInfo && profile.subscription_status === "trialing") {
            // Check if promo trial is still active
            const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
            tier = trialEnd && trialEnd > new Date() ? "promo" : "expired"
        } else if (profile.subscription_status === "trialing") {
            const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
            tier = trialEnd && trialEnd > new Date() ? "trial" : "expired"
        } else if (profile.subscription_status === "active") {
            tier = "paid"
        } else {
            tier = "expired"
        }

        // Calculate days remaining
        let daysRemaining: number | null = null
        if (tier === "paid" && billingInfo?.current_period_end) {
            const end = new Date(billingInfo.current_period_end)
            daysRemaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        } else if ((tier === "trial" || tier === "promo") && profile.trial_ends_at) {
            const end = new Date(profile.trial_ends_at)
            daysRemaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        }

        return {
            ...profile,
            company_email: profile.company_email || authUser?.email || null,
            tier,
            daysRemaining,
            promoInfo,
            billingInfo,
        }
    })

    // Stats
    const totalUsers = users.length
    const ownerCount = users.filter(u => u.tier === "owner").length
    const promoCount = users.filter(u => u.tier === "promo").length
    const trialCount = users.filter(u => u.tier === "trial").length
    const paidCount = users.filter(u => u.tier === "paid").length
    const expiredCount = users.filter(u => u.tier === "expired").length
    
    const freeAccounts = trialCount + promoCount + expiredCount
    const monthlyRevenue = monthlyActive * 19
    const annualRevenue = yearlyActive * 190
    const totalMRR = monthlyRevenue + (annualRevenue / 12)
    const conversionRate = totalUsers > ownerCount ? (paidCount / (totalUsers - ownerCount)) * 100 : 0

    const dashboardStats = {
        totalUsers,
        freeAccounts,
        monthlyActive,
        yearlyActive,
        totalPaid: paidCount,
        monthlyRevenue,
        annualRevenue,
        totalMRR,
        conversionRate,
        duplicateSubscriptions
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage all registered users on the platform
                </p>
            </div>

            {/* Advanced Stats Dashboard */}
            <AdminDashboardStats stats={dashboardStats} />

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatsCard
                    title="Owners"
                    value={ownerCount}
                    iconName="Users"
                    description="lifetime access"
                />
                <StatsCard
                    title="Promo Friends"
                    value={promoCount}
                    iconName="Users"
                    description="extended trial"
                />
                <StatsCard
                    title="Free Trial"
                    value={trialCount}
                    iconName="Users"
                    description="30-day trial"
                />
                <StatsCard
                    title="Paid"
                    value={paidCount}
                    iconName="DollarSign"
                    description="active subscriptions"
                />
                <StatsCard
                    title="Expired"
                    value={expiredCount}
                    iconName="Users"
                    description="read-only access"
                />
            </div>

            {/* Users Table */}
            <UsersTable initialUsers={users} />
        </div>
    )
}
