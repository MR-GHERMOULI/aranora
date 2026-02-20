import { getAnalyticsData, getClientAnalytics, getExportData, getTaskAnalytics, getExpenseData, getProjectProfitability } from "./actions";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { ExportCSVButton } from "@/components/reports/export-csv-button";
import { DonutChart } from "@/components/reports/donut-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DollarSign, Users, Briefcase, TrendingUp, TrendingDown,
    CheckCircle2, ListTodo, CreditCard, PieChart, Target
} from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
    const [data, clientAnalytics, exportData, taskAnalytics, expenseData, projectProfitability] = await Promise.all([
        getAnalyticsData(),
        getClientAnalytics(),
        getExportData(),
        getTaskAnalytics(),
        getExpenseData(),
        getProjectProfitability(),
    ]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const profitLoss = data.totalRevenue - (expenseData.totalYearly || 0);

    // Project status donut data
    const projectDonutData = [
        { name: "In Progress", value: data.projectStats.inProgress },
        { name: "Completed", value: data.projectStats.completed },
        { name: "Pending", value: data.projectStats.pending },
    ].filter(d => d.value > 0);

    // Task status donut data
    const taskDonutData = [
        { name: "To Do", value: taskAnalytics.todo },
        { name: "In Progress", value: taskAnalytics.inProgress },
        { name: "Completed", value: taskAnalytics.completed },
    ].filter(d => d.value > 0);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Reports & Analytics</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Comprehensive insights into your business performance.
                    </p>
                </div>
                <ExportCSVButton data={exportData} filename="invoices-report" />
            </div>

            {/* Financial Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.pendingRevenue)}</div>
                        <p className="text-xs text-muted-foreground">From sent invoices</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(expenseData.totalMonthly)}</div>
                        <p className="text-xs text-muted-foreground">{expenseData.count} active subscriptions</p>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${profitLoss >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        {profitLoss >= 0
                            ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                            : <TrendingDown className="h-4 w-4 text-red-600" />
                        }
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(profitLoss)}
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart + Project Status Donut */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Monthly income from paid invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={data.chartData} />
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-brand-primary" />
                            Project Status
                        </CardTitle>
                        <CardDescription>Distribution of project states.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projectDonutData.length > 0 ? (
                            <DonutChart
                                data={projectDonutData}
                                colors={["#3b82f6", "#22c55e", "#f59e0b"]}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <Briefcase className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No projects yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Task Analytics + Expense Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Task Analytics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-indigo-500" />
                            Task Analytics
                        </CardTitle>
                        <CardDescription>Task completion and productivity stats.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold">{taskAnalytics.total}</p>
                                <p className="text-xs text-muted-foreground">Total Tasks</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold text-green-600">{taskAnalytics.completionRate}%</p>
                                <p className="text-xs text-muted-foreground">Completion Rate</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Completion Progress</span>
                                <span className="font-medium">{taskAnalytics.completed}/{taskAnalytics.total}</span>
                            </div>
                            <Progress value={taskAnalytics.completionRate} className="h-2" />
                        </div>

                        {taskDonutData.length > 0 && (
                            <DonutChart
                                data={taskDonutData}
                                colors={["#6366f1", "#f59e0b", "#22c55e"]}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-orange-500" />
                            Expense Breakdown
                        </CardTitle>
                        <CardDescription>Monthly subscription costs by category.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold">{formatCurrency(expenseData.totalMonthly)}</p>
                                <p className="text-xs text-muted-foreground">Monthly</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold">{formatCurrency(expenseData.totalYearly)}</p>
                                <p className="text-xs text-muted-foreground">Yearly</p>
                            </div>
                        </div>

                        {expenseData.categoryBreakdown.length > 0 ? (
                            <DonutChart
                                data={expenseData.categoryBreakdown}
                                colors={["#f97316", "#ef4444", "#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899"]}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <CreditCard className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No subscriptions tracked</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Project Profitability */}
            {projectProfitability.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-violet-500" />
                            Project Profitability
                        </CardTitle>
                        <CardDescription>Budget vs invoiced amount per project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Budget</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Invoiced</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[180px]">Utilization</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {projectProfitability.map((project) => (
                                        <tr key={project.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{project.title}</td>
                                            <td className="p-4 align-middle text-center">
                                                <Badge variant="outline" className="text-xs">{project.status}</Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">{formatCurrency(project.budget)}</td>
                                            <td className="p-4 align-middle text-right font-semibold">{formatCurrency(project.invoiced)}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <Progress
                                                        value={Math.min(project.utilization, 100)}
                                                        className="h-2 flex-1"
                                                    />
                                                    <span className={`text-xs font-medium min-w-[36px] text-right ${project.utilization > 100 ? 'text-red-600' : project.utilization > 80 ? 'text-green-600' : ''}`}>
                                                        {project.utilization}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Clients Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-primary" />
                        Top Clients by Revenue
                    </CardTitle>
                    <CardDescription>Your highest earning client relationships.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Projects</th>
                                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Invoices</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {clientAnalytics.slice(0, 5).map((client) => (
                                    <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <Link href={`/clients/${client.id}`} className="font-medium text-brand-primary hover:underline">
                                                {client.name}
                                            </Link>
                                        </td>
                                        <td className="p-4 align-middle text-center">{client.projectCount}</td>
                                        <td className="p-4 align-middle text-center">{client.invoiceCount}</td>
                                        <td className="p-4 align-middle text-right font-bold">{formatCurrency(client.revenue)}</td>
                                    </tr>
                                ))}
                                {clientAnalytics.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">No client data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
