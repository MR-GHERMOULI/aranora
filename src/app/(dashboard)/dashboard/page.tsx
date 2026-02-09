import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Users, Briefcase, FileText, DollarSign, TrendingUp, Clock,
    ArrowRight, Plus, Calendar, CheckCircle2, AlertCircle
} from "lucide-react";
import { getDashboardStats } from "./actions";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SmartRemindersWidget } from "@/components/dashboard/smart-reminders";
import { ClientGreeting } from "@/components/dashboard/client-greeting";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    const getDisplayName = () => {
        if (stats.profile.full_name) return stats.profile.full_name.split(' ')[0];
        if (stats.profile.username) return stats.profile.username;
        return 'User';
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="min-h-screen bg-background">
            <div className="px-4 lg:px-8 space-y-6 pt-8 pb-12">
                {/* Welcome Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary-light to-brand-secondary p-8 text-white">
                    <div className="absolute inset-0 opacity-10">
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">
                                <ClientGreeting fallback="Hello" />, {getDisplayName()}! 👋
                            </h1>
                            <p className="text-white/80">
                                Here's what's happening with your business today.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="secondary" asChild>
                                <Link href="/clients">
                                    <Plus className="mr-2 h-4 w-4" /> New Client
                                </Link>
                            </Button>
                            <Button variant="secondary" asChild>
                                <Link href="/projects">
                                    <Plus className="mr-2 h-4 w-4" /> New Project
                                </Link>
                            </Button>
                            <Button variant="secondary" asChild>
                                <Link href="/invoices/new">
                                    <Plus className="mr-2 h-4 w-4" /> New Invoice
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Smart Reminders */}
                <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-2xl" />}>
                    <SmartRemindersWidget />
                </Suspense>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-secondary">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                {formatCurrency(stats.monthlyRevenue)} this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalClients}</div>
                            <p className="text-xs text-muted-foreground">Total clients in database</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-violet-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.activeProjects}</div>
                            <p className="text-xs text-muted-foreground">Projects currently in progress</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
                            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
                            <p className="text-xs text-muted-foreground">Awaiting payment</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Revenue Chart - Takes 2 columns */}
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription>Your earnings over the last 6 months</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/reports">View Reports <ArrowRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart data={stats.revenueChartData} />
                        </CardContent>
                    </Card>

                    {/* Project Status Breakdown */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Project Status</CardTitle>
                            <CardDescription>Distribution of your projects</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(stats.projectStatusCounts).map(([status, count]) => {
                                const colors: Record<string, string> = {
                                    'Planning': 'bg-slate-500',
                                    'In Progress': 'bg-blue-500',
                                    'On Hold': 'bg-yellow-500',
                                    'Completed': 'bg-green-500',
                                    'Cancelled': 'bg-red-500'
                                };
                                const total = Object.values(stats.projectStatusCounts).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{status}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Second Row: Recent Projects & Upcoming Deadlines */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Projects */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Projects</CardTitle>
                                <CardDescription>Your latest project activities</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/projects">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {stats.recentProjects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>No projects yet. Create your first one!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.recentProjects.map((project: any) => (
                                        <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                                                    <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium group-hover:text-brand-primary transition-colors">{project.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Created {new Date(project.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'} className="text-xs">
                                                {project.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Deadlines */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Upcoming Deadlines</CardTitle>
                                <CardDescription>Tasks requiring your attention</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/calendar">View Calendar <ArrowRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {stats.upcomingDeadlines.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-70" />
                                    <p>All caught up! No pending deadlines.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.upcomingDeadlines.map((task: any) => {
                                        const dueDate = new Date(task.due_date);
                                        const isUrgent = dueDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;
                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isUrgent ? 'bg-red-100 dark:bg-red-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
                                                        {isUrgent ? <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> : <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{task.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {/* @ts-ignore */}
                                                            {task.project?.title || 'General Task'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={isUrgent ? 'destructive' : 'outline'} className="text-xs">
                                                    {dueDate.toLocaleDateString()}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Invoices */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Invoices</CardTitle>
                            <CardDescription>Latest billing activity</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/invoices">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats.recentInvoices.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p>No invoices yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">Invoice</th>
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentInvoices.map((invoice: any) => (
                                            <tr key={invoice.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 font-medium">{invoice.invoice_number}</td>
                                                <td className="py-3 text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 font-medium">{formatCurrency(invoice.total || 0)}</td>
                                                <td className="py-3">
                                                    <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Overdue' ? 'destructive' : 'secondary'}>
                                                        {invoice.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/invoices/${invoice.id}`}>View</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
