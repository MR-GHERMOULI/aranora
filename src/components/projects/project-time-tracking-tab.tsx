"use client";

import { TimeEntry } from "@/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, DollarSign, Clock, Users, User } from "lucide-react";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { differenceInSeconds } from "date-fns";
import { ManualEntryDialog } from "@/components/time-tracking/manual-entry-dialog";
import Image from "next/image";

interface MemberProfile {
    id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
}

type EnrichedTimeEntry = TimeEntry & {
    member?: MemberProfile;
};

interface ProjectTimeTrackingTabProps {
    entries: EnrichedTimeEntry[];
    projectId: string;
    isOwner?: boolean;
}

export function ProjectTimeTrackingTab({ entries, projectId, isOwner }: ProjectTimeTrackingTabProps) {
    // Total time across ALL members
    const totalSeconds = entries.reduce((sum, entry) => {
        if (!entry.end_time) return sum;
        return sum + differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
    }, 0);

    // Unbilled revenue across ALL members
    const unbilledRevenue = entries.reduce((sum, entry) => {
        if (!entry.end_time || !entry.is_billable || entry.invoice_id) return sum;
        const durationSeconds = differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
        const rate = entry.hourly_rate || 0;
        return sum + ((durationSeconds / 3600) * rate);
    }, 0);

    // Group time by member for the breakdown
    const memberBreakdown = entries.reduce((acc, entry) => {
        const memberId = entry.user_id;
        if (!acc[memberId]) {
            acc[memberId] = {
                profile: entry.member || { id: memberId, full_name: "Unknown", username: null, avatar_url: null },
                totalSeconds: 0,
                billableSeconds: 0,
                earnings: 0,
                entryCount: 0,
            };
        }
        if (entry.end_time) {
            const dur = differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
            acc[memberId].totalSeconds += dur;
            acc[memberId].entryCount += 1;
            if (entry.is_billable) {
                acc[memberId].billableSeconds += dur;
                acc[memberId].earnings += (dur / 3600) * (entry.hourly_rate || 0);
            }
        }
        return acc;
    }, {} as Record<string, {
        profile: MemberProfile;
        totalSeconds: number;
        billableSeconds: number;
        earnings: number;
        entryCount: number;
    }>);

    const memberList = Object.values(memberBreakdown).sort((a, b) => b.totalSeconds - a.totalSeconds);
    const hasMultipleMembers = memberList.length > 1;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2 border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Time Logged</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(totalSeconds)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {hasMultipleMembers
                                ? `Across ${memberList.length} team members`
                                : "Across all sessions"
                            }
                        </p>
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

            {/* Per-Member Breakdown — shown when multiple members have logged time */}
            {hasMultipleMembers && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-brand-primary" />
                            <CardTitle>Time by Team Member</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Individual contribution breakdown for this project
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {memberList.map((member) => {
                                const percentage = totalSeconds > 0
                                    ? Math.round((member.totalSeconds / totalSeconds) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={member.profile.id}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
                                            {member.profile.avatar_url ? (
                                                <Image
                                                    src={member.profile.avatar_url}
                                                    alt={member.profile.full_name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name + handle */}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate leading-tight">
                                                {member.profile.full_name}
                                            </p>
                                            {member.profile.username && (
                                                <p className="text-xs text-muted-foreground">
                                                    @{member.profile.username}
                                                </p>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="hidden sm:flex flex-1 items-center gap-2 max-w-[200px]">
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-primary rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-8 text-right font-mono">
                                                {percentage}%
                                            </span>
                                        </div>

                                        {/* Time */}
                                        <div className="text-right shrink-0">
                                            <p className="font-mono font-semibold text-sm">
                                                {formatDuration(member.totalSeconds)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {member.entryCount} {member.entryCount === 1 ? "session" : "sessions"}
                                            </p>
                                        </div>

                                        {/* Earnings (owner sees all, member sees own) */}
                                        {member.earnings > 0 && (
                                            <div className="text-right shrink-0 border-l pl-3 ml-1">
                                                <p className="font-mono font-semibold text-sm text-emerald-600">
                                                    {formatCurrency(member.earnings)}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">earned</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Full Time Log */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Time Logs</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {hasMultipleMembers
                                ? "Activity recorded by all project members"
                                : "Activity recorded for this project"
                            }
                        </p>
                    </div>
                    <ManualEntryDialog initialData={{ project_id: projectId }} />
                </CardHeader>
                <CardContent>
                    <TimeLogTable entries={entries} showMember={hasMultipleMembers} />
                </CardContent>
            </Card>
        </div>
    );
}
