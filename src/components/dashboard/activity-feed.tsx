"use client";

import { formatDistanceToNow } from "date-fns";
import { Briefcase, FileText, Users, ArrowRight, PenTool } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Activity {
    type: string;
    id: string;
    title: string;
    date: string;
    link: string;
}

const iconMap: Record<string, { icon: typeof Briefcase; color: string; bg: string }> = {
    project: { icon: Briefcase, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
    invoice: { icon: FileText, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
    client: { icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    contract: { icon: PenTool, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
    if (activities.length === 0) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest actions across all modules</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="font-medium">No activity yet</p>
                        <p className="text-sm mt-1">Start creating projects and invoices to see your activity here.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest actions across all modules</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

                    <div className="space-y-1">
                        {activities.map((activity, index) => {
                            const config = iconMap[activity.type] || iconMap.project;
                            const Icon = config.icon;

                            return (
                                <Link
                                    key={activity.id}
                                    href={activity.link}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/60 transition-colors group relative"
                                >
                                    <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 relative z-10 ring-4 ring-card`}>
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate group-hover:text-brand-primary transition-colors">
                                            {activity.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
