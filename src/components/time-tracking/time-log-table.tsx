"use client";

import { TimeEntry } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Clock, Briefcase, ListTodo } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { formatDuration } from "@/lib/utils";
import { deleteTimeEntry } from "@/app/(dashboard)/time-tracking/actions";
import { toast } from "sonner";
import { EditEntryDialog } from "./edit-entry-dialog";

interface TimeLogTableProps {
    entries: TimeEntry[];
}

export function TimeLogTable({ entries }: TimeLogTableProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        try {
            await deleteTimeEntry(id);
            toast.success("Entry deleted");
        } catch (error) {
            toast.error("Failed to delete entry");
        }
    };

    const groupedEntries = entries.reduce((acc, entry) => {
        const date = format(new Date(entry.start_time), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, TimeEntry[]>);

    return (
        <div className="space-y-8">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => {
                const totalSeconds = dayEntries.reduce((sum, entry) => {
                    if (!entry.end_time) return sum;
                    return sum + differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time));
                }, 0);

                return (
                    <div key={date} className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold">
                                {format(new Date(date), "EEEE, MMM d, yyyy")}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="font-mono">{formatDuration(totalSeconds)}</span>
                            </div>
                        </div>
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Project / Task</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dayEntries.map((entry) => {
                                        const duration = entry.end_time
                                            ? differenceInSeconds(new Date(entry.end_time), new Date(entry.start_time))
                                            : 0;

                                        return (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {entry.description}
                                                    {entry.is_billable ? (
                                                        <Badge variant="outline" className="ml-2 text-[10px] h-4 bg-green-50 text-green-700 border-green-200">Billable</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="ml-2 text-[10px] h-4 bg-gray-50 text-gray-700 border-gray-200">Non-billable</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {entry.project && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Briefcase className="h-3 w-3" />
                                                                {entry.project.title}
                                                            </div>
                                                        )}
                                                        {entry.task && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <ListTodo className="h-3 w-3" />
                                                                {entry.task.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-mono">
                                                    {entry.end_time ? formatDuration(duration) : (
                                                        <Badge variant="secondary" className="animate-pulse">Active</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(entry.start_time), "HH:mm")} - {entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "..."}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <EditEntryDialog entry={entry} />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(entry.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                );
            })}
            {entries.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No time logs found.</p>
                </div>
            )}
        </div>
    );
}
