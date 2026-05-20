export const dynamic = 'force-dynamic'

import { createAdminClient } from "@/lib/supabase/server"
import { AdminDashboardClient } from "./dashboard-client"

export default async function AdminDashboardPage() {
    const supabaseAdmin = createAdminClient()

    // Fetch statistics
    const [
        { count: totalUsers },
        { count: totalProjects },
        { count: activeProjects },
        { count: completedProjects },
        { count: totalInvoices },
        { count: paidInvoices },
        { count: totalClients },
        { count: completedContracts },
        { count: intakeFormsCount },
        { data: timeEntries },
        { data: recentUsers },
        { data: projectsByStatus },
        { data: invoicesByMonth },
        { data: usersByCountry },
    ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "In Progress"),
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "Completed"),
        supabaseAdmin.from("invoices").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Paid"),
        supabaseAdmin.from("clients").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("contracts").select("*", { count: "exact", head: true }).eq("status", "Signed"),
        supabaseAdmin.from("intake_forms").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("time_entries").select("start_time, end_time").not("end_time", "is", null),
        supabaseAdmin.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(100),
        supabaseAdmin.from("projects").select("status"),
        supabaseAdmin.from("invoices").select("total, created_at"),
        supabaseAdmin.from("profiles").select("country"),
    ])

    // Calculate total time recorded in hours
    const totalTimeSeconds = (timeEntries || []).reduce((acc, entry) => {
        const start = new Date(entry.start_time).getTime()
        const end = new Date(entry.end_time).getTime()
        return acc + (end - start) / 1000
    }, 0)
    const totalTimeHours = Math.round(totalTimeSeconds / 3600)

    // Calculate monthly active users (users created in last 30 days as proxy)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const mau = recentUsers?.filter(
        (u) => new Date(u.created_at) > thirtyDaysAgo
    ).length || 0

    // Calculate growth rate
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const usersLast30Days = recentUsers?.filter(
        (u) => new Date(u.created_at) > thirtyDaysAgo
    ).length || 0
    const usersPrev30Days = recentUsers?.filter(
        (u) => new Date(u.created_at) > sixtyDaysAgo && new Date(u.created_at) <= thirtyDaysAgo
    ).length || 0
    const growthRate = usersPrev30Days > 0
        ? ((usersLast30Days - usersPrev30Days) / usersPrev30Days * 100).toFixed(1)
        : 100

    // Process projects by status
    const statusCounts = (projectsByStatus || []).reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const projectsChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
    }))

    // Process invoices by month
    const invoicesByMonthData = processInvoicesByMonth(invoicesByMonth || [])

    // Process users by country
    const countryCounts = (usersByCountry || []).reduce((acc, u) => {
        const country = u.country || "Unknown"
        acc[country] = (acc[country] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const geoChartData = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([country, users]) => ({
            country,
            users,
            color: "",
        }))

    // Generate user growth data from actual history
    const userGrowthData = generateUserGrowthData(recentUsers || [])

    return (
        <AdminDashboardClient
            stats={{
                totalUsers: totalUsers || 0,
                mau,
                activeProjects: activeProjects || 0,
                totalProjects: totalProjects || 0,
                completedProjects: completedProjects || 0,
                totalInvoices: totalInvoices || 0,
                paidInvoices: paidInvoices || 0,
                growthRate: parseFloat(growthRate as string),
                totalClients: totalClients || 0,
                totalTimeHours,
                completedContracts: completedContracts || 0,
                intakeFormsCount: intakeFormsCount || 0,
            }}
            charts={{
                userGrowth: userGrowthData,
                projectsByStatus: projectsChartData,
                invoicesByMonth: invoicesByMonthData,
                geoDistribution: geoChartData,
            }}
        />
    )
}

function processInvoicesByMonth(invoices: { total: number; created_at: string }[]) {
    const months: Record<string, { amount: number; count: number }> = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    invoices.forEach((inv) => {
        const date = new Date(inv.created_at)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        if (!months[monthKey]) {
            months[monthKey] = { amount: 0, count: 0 }
        }
        months[monthKey].amount += inv.total || 0
        months[monthKey].count += 1
    })

    return Object.entries(months)
        .slice(-6)
        .map(([month, data]) => ({
            month,
            amount: Math.round(data.amount),
            count: data.count,
        }))
}

function generateUserGrowthData(recentUsers: { created_at: string }[]) {
    const months: Record<string, { users: number; newUsers: number }> = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    // Sort users by date
    const sortedUsers = [...recentUsers].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let runningTotal = 0
    const now = new Date()
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
        months[monthKey] = { users: 0, newUsers: 0 }
    }

    // Count new users per month
    sortedUsers.forEach(u => {
        const date = new Date(u.created_at)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        if (months[monthKey]) {
            months[monthKey].newUsers += 1
        }
    })

    // Calculate running total (approximate based on current users and historical additions)
    // We'll work backwards from the current total if we don't have the full history
    // But since we have recentUsers (limit 100), we can at least show growth for those.
    
    return Object.entries(months).map(([month, data]) => ({
        month,
        users: data.newUsers, // For now just show new users as the primary metric if total history isn't available
        newUsers: data.newUsers
    }))
}
