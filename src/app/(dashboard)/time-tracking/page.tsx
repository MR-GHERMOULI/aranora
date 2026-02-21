import { getTimeEntries } from "./actions";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { ManualEntryDialog } from "@/components/time-tracking/manual-entry-dialog";
import { Timer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function TimeTrackingPage() {
    const entries = await getTimeEntries();

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer className="h-8 w-8 text-indigo-500" />
                    <h2 className="text-3xl font-bold tracking-tight">Time Tracking</h2>
                </div>
                <ManualEntryDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42h 15m</div>
                        <p className="text-xs text-muted-foreground">+12% from last week</p>
                    </CardContent>
                </Card>
                {/* Add more summary cards here later */}
            </div>

            <TimeLogTable entries={entries} />
        </div>
    );
}
