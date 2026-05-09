"use client"

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
        completedProjects: number
        totalInvoices: number
        paidInvoices: number
        growthRate: number
        totalClients: number
        totalTimeHours: number
        completedContracts: number
        intakeFormsCount: number
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

            {/* Platform Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    iconName="Users"
                    trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
                    description="all time"
                    delay={0.05}
                />
                <StatsCard
                    title="Growth Rate"
                    value={`${stats.growthRate}%`}
                    iconName="TrendingUp"
                    trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
                    description="monthly"
                    delay={0.1}
                />
                <StatsCard
                    title="Active Users"
                    value={stats.mau}
                    iconName="Activity"
                    description="last 30 days"
                    delay={0.15}
                />
                <StatsCard
                    title="Total Invoices"
                    value={stats.totalInvoices}
                    iconName="FileText"
                    description="all time"
                    delay={0.2}
                />
                <StatsCard
                    title="Paid Invoices"
                    value={stats.paidInvoices}
                    iconName="DollarSign"
                    description={`${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% rate`}
                    delay={0.25}
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${Math.round(charts.invoicesByMonth.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}`}
                    iconName="BarChart"
                    description="last 6 months"
                    delay={0.3}
                />
            </div>

            {/* Operational Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatsCard
                    title="Total Clients"
                    value={stats.totalClients}
                    iconName="Contact"
                    description="registered clients"
                    className="bg-primary/5"
                    delay={0.35}
                />
                <StatsCard
                    title="Completed Projects"
                    value={stats.completedProjects}
                    iconName="ClipboardCheck"
                    description="by freelancers"
                    className="bg-primary/5"
                    delay={0.4}
                />
                <StatsCard
                    title="Total Time"
                    value={`${stats.totalTimeHours}h`}
                    iconName="Clock"
                    description="tracked by users"
                    className="bg-primary/5"
                    delay={0.45}
                />
                <StatsCard
                    title="Completed Contracts"
                    value={stats.completedContracts}
                    iconName="FileCheck"
                    description="signed by clients"
                    className="bg-primary/5"
                    delay={0.5}
                />
                <StatsCard
                    title="Intake Forms"
                    value={stats.intakeFormsCount}
                    iconName="Briefcase"
                    description="prepared & sent"
                    className="bg-primary/5"
                    delay={0.55}
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
