import { getAnalyticsData, getClientAnalytics, getExportData } from "./actions";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { ExportCSVButton } from "@/components/reports/export-csv-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
    const [data, clientAnalytics, exportData] = await Promise.all([
        getAnalyticsData(),
        getClientAnalytics(),
        getExportData()
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Reports & Analytics</h2>
                    <p className="text-muted-foreground">
                        Insights into your business performance.
                    </p>
                </div>
                <ExportCSVButton data={exportData} filename="invoices-report" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime earnings
                        </p>
                    </CardContent>
                </Card>

                {/* Pending Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Revenue
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.pendingRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            From sent invoices
                        </p>
                    </CardContent>
                </Card>

                {/* Clients */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Clients
                        </CardTitle>
                        <Users className="h-4 w-4 text-brand-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalClients}</div>
                    </CardContent>
                </Card>

                {/* Projects */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Projects
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-brand-secondary-dark" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.projectStats.inProgress} active, {data.projectStats.completed} completed
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                        <CardTitle>Project Status</CardTitle>
                        <CardDescription>Distribution of project states.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm font-medium">In Progress</span>
                                </div>
                                <span className="font-bold">{data.projectStats.inProgress}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm font-medium">Completed</span>
                                </div>
                                <span className="font-bold">{data.projectStats.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm font-medium">Pending</span>
                                </div>
                                <span className="font-bold">{data.projectStats.pending}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Clients Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Clients by Revenue</CardTitle>
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
                                            <Link href={`/dashboard/clients/${client.id}`} className="font-medium text-brand-primary hover:underline">
                                                {client.name}
                                            </Link>
                                        </td>
                                        <td className="p-4 align-middle text-center">{client.projectCount}</td>
                                        <td className="p-4 align-middle text-center">{client.invoiceCount}</td>
                                        <td className="p-4 align-middle text-right font-bold">${client.revenue.toLocaleString()}</td>
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

