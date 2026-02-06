import { createClient } from "@/lib/supabase/server"
import { AdminDashboardClient } from "./dashboard-client"

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Fetch statistics
    const [
        { count: totalUsers },
        { count: totalProjects },
        { count: activeProjects },
        { count: totalInvoices },
        { count: paidInvoices },
        { data: recentUsers },
        { data: projectsByStatus },
        { data: invoicesByMonth },
        { data: usersByCountry },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "In Progress"),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "Paid"),
        supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("projects").select("status"),
        supabase.from("invoices").select("total, created_at"),
        supabase.from("profiles").select("country"),
    ])

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

    // Generate mock growth data (in production, this would come from actual historical data)
    const userGrowthData = generateUserGrowthData(totalUsers || 0)

    return (
        <AdminDashboardClient
            stats={{
                totalUsers: totalUsers || 0,
                mau,
                activeProjects: activeProjects || 0,
                totalProjects: totalProjects || 0,
                totalInvoices: totalInvoices || 0,
                paidInvoices: paidInvoices || 0,
                growthRate: parseFloat(growthRate as string),
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

function generateUserGrowthData(currentTotal: number) {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]
    const data = []
    let users = Math.max(0, currentTotal - 50)

    for (let i = 0; i < months.length; i++) {
        const newUsers = Math.floor(Math.random() * 15) + 5
        users += newUsers
        data.push({
            month: months[i],
            users: Math.min(users, currentTotal),
            newUsers,
        })
    }

    // Ensure last month matches current total
    if (data.length > 0) {
        data[data.length - 1].users = currentTotal
    }

    return data
}
