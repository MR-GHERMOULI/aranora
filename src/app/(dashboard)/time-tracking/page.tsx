import { getTimeEntries } from "./actions";
import { getTimeTrackingStats } from "@/app/actions/time-stats-actions";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { ManualEntryDialog } from "@/components/time-tracking/manual-entry-dialog";
import { TimeTrackingChart } from "@/components/time-tracking/time-tracking-chart";
import { Timer, TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { cn, formatDuration } from "@/lib/utils";

export default async function TimeTrackingPage() {
    const entries = await getTimeEntries();
    const stats = await getTimeTrackingStats();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const getHAndM = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const diff = stats.totalSecondsThisWeek - stats.totalSecondsLastWeek;
    const percentage = stats.totalSecondsLastWeek > 0
        ? Math.round((Math.abs(diff) / stats.totalSecondsLastWeek) * 100)
        : 0;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Timer className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Time Tracking</h2>
                        <p className="text-muted-foreground">Manage your work hours and productivity.</p>
                    </div>
                </div>
                <ManualEntryDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="relative overflow-hidden group border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getHAndM(stats.totalSecondsThisWeek)}</div>
                        <div className="flex items-center mt-1">
                            {diff >= 0 ? (
                                <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3.5 w-3.5 mr-1 text-red-500" />
                            )}
                            <p className={cn(
                                "text-xs font-medium",
                                diff >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {percentage}% {diff >= 0 ? 'increase' : 'decrease'}
                            </p>
                            <span className="text-xs text-muted-foreground ml-1">vs last week</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unbilled Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.unbilledRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready to be invoiced</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 border-l-4 border-l-brand-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activity Trends</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.weeklyChartData.filter(d => d.hours > 0).length} Days
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Worked this week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Hours logged over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TimeTrackingChart data={stats.weeklyChartData} />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Time Management Tips</CardTitle>
                        <CardDescription>Optimize your workflow</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                            <p className="text-sm font-semibold">Track as you go</p>
                            <p className="text-xs text-muted-foreground">Using the live timer increases data accuracy by 30% compared to manual entries.</p>
                        </div>
                        <div className="bg-brand-primary/5 p-4 rounded-xl space-y-2">
                            <p className="text-sm font-semibold text-brand-primary">Billable Focus</p>
                            <p className="text-xs text-brand-primary/80">You have {formatCurrency(stats.unbilledRevenue)} unbilled. Consider generating an invoice today.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Recent Logs</h3>
                <TimeLogTable entries={entries} />
            </div>
        </div>
    );
}

