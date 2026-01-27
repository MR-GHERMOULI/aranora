"use client"

import { Users, Briefcase, FileText, TrendingUp, Activity, DollarSign } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import {
    ChartCard,
    UserGrowthChart,
    ProjectsChart,
    GeoChart,
    InvoicesChart,
} from "@/components/admin/charts"

interface AdminDashboardClientProps {
    stats: {
        totalUsers: number
        mau: number
        activeProjects: number
        totalProjects: number
        totalInvoices: number
        paidInvoices: number
        growthRate: number
    }
    charts: {
        userGrowth: { month: string; users: number; newUsers: number }[]
        projectsByStatus: { status: string; count: number }[]
        invoicesByMonth: { month: string; amount: number; count: number }[]
        geoDistribution: { country: string; users: number; color: string }[]
    }
}

export function AdminDashboardClient({ stats, charts }: AdminDashboardClientProps) {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here&apos;s an overview of your platform.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
                    description="all time"
                />
                <StatsCard
                    title="Active Users (MAU)"
                    value={stats.mau}
                    icon={Activity}
                    description="last 30 days"
                />
                <StatsCard
                    title="Active Projects"
                    value={stats.activeProjects}
                    icon={Briefcase}
                    description={`of ${stats.totalProjects} total`}
                />
                <StatsCard
                    title="Total Invoices"
                    value={stats.totalInvoices}
                    icon={FileText}
                    description="generated"
                />
                <StatsCard
                    title="Paid Invoices"
                    value={stats.paidInvoices}
                    icon={DollarSign}
                    description={`${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% rate`}
                />
                <StatsCard
                    title="Growth Rate"
                    value={`${stats.growthRate}%`}
                    icon={TrendingUp}
                    trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
                    description="monthly"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard
                    title="User Growth"
                    description="Total users and new registrations over time"
                    className="lg:col-span-2"
                >
                    <UserGrowthChart data={charts.userGrowth} />
                </ChartCard>

                <ChartCard
                    title="Projects by Status"
                    description="Distribution of project statuses"
                >
                    <ProjectsChart data={charts.projectsByStatus} />
                </ChartCard>

                <ChartCard
                    title="Geographic Distribution"
                    description="Users by country/region"
                >
                    <GeoChart data={charts.geoDistribution} />
                </ChartCard>

                <ChartCard
                    title="Invoice Analytics"
                    description="Revenue and invoice count by month"
                    className="lg:col-span-2"
                >
                    <InvoicesChart data={charts.invoicesByMonth} />
                </ChartCard>
            </div>
        </div>
    )
}
