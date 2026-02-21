"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";

interface TimeSummaryWidgetProps {
    totalSeconds: number;
    hasActiveTimer: boolean;
}

export function TimeSummaryWidget({ totalSeconds, hasActiveTimer }: TimeSummaryWidgetProps) {
    return (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Time This Week</CardTitle>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${hasActiveTimer ? 'bg-amber-100 dark:bg-amber-900/20 animate-pulse' : 'bg-slate-100 dark:bg-slate-900/20'}`}>
                    <Timer className={`h-5 w-5 ${hasActiveTimer ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formatDuration(totalSeconds)}</div>
                <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {hasActiveTimer ? "Timer currently running" : "No active timer"}
                    </p>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 group/btn" asChild>
                        <Link href="/time-tracking">
                            View Logs
                            <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
