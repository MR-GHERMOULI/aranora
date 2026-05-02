"use client"

import { Card } from "@/components/ui/card"
import { 
    Users, 
    CreditCard, 
    Calendar, 
    DollarSign, 
    TrendingUp, 
    AlertCircle,
    UserPlus,
    Clock
} from "lucide-react"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts"

interface AdminDashboardStatsProps {
    stats: {
        totalUsers: number
        freeAccounts: number
        monthlyActive: number
        yearlyActive: number
        totalPaid: number
        monthlyRevenue: number
        annualRevenue: number
        totalMRR: number
        conversionRate: number
        duplicateSubscriptions: number
    }
}

export function AdminDashboardStats({ stats }: AdminDashboardStatsProps) {
    const data = [
        { name: 'Monthly', value: stats.monthlyActive, color: '#10b981' }, // emerald-500
        { name: 'Annual', value: stats.yearlyActive, color: '#3b82f6' }, // blue-500
        { name: 'Free/Trial', value: stats.freeAccounts, color: '#94a3b8' }, // slate-400
    ].filter(item => item.value > 0)

    const revenueData = [
        { name: 'Monthly Rev.', value: stats.monthlyRevenue, color: '#10b981' },
        { name: 'Annual Rev.', value: stats.annualRevenue, color: '#3b82f6' },
    ].filter(item => item.value > 0)

    return (
        <div className="space-y-6">
            {/* Primary Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue (MRR)</p>
                            <h3 className="text-3xl font-bold mt-1">${stats.totalMRR.toLocaleString()}</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Est. monthly recurring
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conversion Rate</p>
                            <h3 className="text-3xl font-bold mt-1">{stats.conversionRate.toFixed(1)}%</h3>
                            <p className="text-xs text-blue-600 font-medium mt-1">
                                From free to paid
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Active</p>
                            <h3 className="text-3xl font-bold mt-1">{stats.monthlyActive}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                ${stats.monthlyRevenue.toLocaleString()} / mo
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Annual Active</p>
                            <h3 className="text-3xl font-bold mt-1">{stats.yearlyActive}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                ${stats.annualRevenue.toLocaleString()} / yr
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts and Details */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6 col-span-1 border-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Subscription Split</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 col-span-1 lg:col-span-2 border-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Detailed Breakdown</h4>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                                    <span className="text-sm font-medium">Free Accounts</span>
                                </div>
                                <span className="font-bold">{stats.freeAccounts}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium">Monthly Subs</span>
                                </div>
                                <span className="font-bold">{stats.monthlyActive}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium">Annual Subs</span>
                                </div>
                                <span className="font-bold">{stats.yearlyActive}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span className="text-sm font-medium">Total Users</span>
                                </div>
                                <span className="font-bold">{stats.totalUsers}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="text-sm font-medium">Total Paid</span>
                                </div>
                                <span className="font-bold text-emerald-600">{stats.totalPaid}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Duplicates</span>
                                </div>
                                <span className="font-bold text-amber-600">{stats.duplicateSubscriptions}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Platform Growth</p>
                                <p className="text-xs text-muted-foreground">Monitoring subscription and retention metrics</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold">${(stats.totalMRR * 12).toLocaleString()}</p>
                            <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Estimated ARR</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
