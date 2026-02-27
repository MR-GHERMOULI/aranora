"use client";

import { TimeEntry } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, DollarSign, Clock } from "lucide-react";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { differenceInSeconds } from "date-fns";
import { ManualEntryDialog } from "@/components/time-tracking/manual-entry-dialog";

interface ProjectTimeTrackingTabProps {
    entries: TimeEntry[];
    projectId: string;
}

export function ProjectTimeTrackingTab({ entries, projectId }: ProjectTimeTrackingTabProps) {
    const totalSeconds = entries.reduce((sum, entry) => {
        if (!entry.end_time) return sum;
        return sum + differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
    }, 0);

    const unbilledRevenue = entries.reduce((sum, entry) => {
        if (!entry.end_time || !entry.is_billable || entry.invoice_id) return sum;
        const durationSeconds = differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
        const rate = entry.hourly_rate || 0;
        return sum + ((durationSeconds / 3600) * rate);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2 border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Time Logged</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(totalSeconds)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
                    </CardContent>
                </Card>

                <Card className="col-span-2 border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unbilled Project Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(unbilledRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready to be invoiced</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Time Logs</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Activity recorded for this project</p>
                    </div>
                    <ManualEntryDialog initialData={{ project_id: projectId }} />
                </CardHeader>
                <CardContent>
                    <TimeLogTable entries={entries} />
                </CardContent>
            </Card>
        </div>
    );
}
