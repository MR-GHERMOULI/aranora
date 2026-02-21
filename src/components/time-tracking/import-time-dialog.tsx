"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Plus } from "lucide-react";
import { getUnbilledEntries } from "@/app/(dashboard)/time-tracking/actions";
import { TimeEntry } from "@/types";
import { formatDuration } from "@/lib/utils";

interface ImportTimeDialogProps {
    projectId?: string;
    onImport: (entries: TimeEntry[]) => void;
}

export function ImportTimeDialog({ projectId, onImport }: ImportTimeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            loadEntries();
        }
    }, [open, projectId]);

    async function loadEntries() {
        setIsLoading(true);
        try {
            const data = await getUnbilledEntries(projectId);
            setEntries(data);
        } catch (error) {
            console.error("Failed to load unbilled entries:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleImport = () => {
        const selectedEntries = entries.filter(e => selectedIds.has(e.id));
        onImport(selectedEntries);
        setOpen(false);
        setSelectedIds(new Set());
    };

    const totalSelectedSeconds = entries
        .filter(e => selectedIds.has(e.id))
        .reduce((sum, e) => {
            if (!e.start_time || !e.end_time) return sum;
            const start = new Date(e.start_time).getTime();
            const end = new Date(e.end_time).getTime();
            return sum + (end - start) / 1000;
        }, 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Import Tracked Time
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Unbilled Time</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No unbilled time entries found for this project.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {entries.map((entry) => {
                                const start = new Date(entry.start_time).getTime();
                                const end = entry.end_time ? new Date(entry.end_time).getTime() : start;
                                const duration = (end - start) / 1000;

                                return (
                                    <div
                                        key={entry.id}
                                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`entry-${entry.id}`}
                                            checked={selectedIds.has(entry.id)}
                                            onChange={() => toggleSelect(entry.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col gap-0.5">
                                                <label
                                                    htmlFor={`entry-${entry.id}`}
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    {entry.description || "No description"}
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(entry.start_time).toLocaleDateString()} • {formatDuration(Math.round(duration))}
                                                </p>
                                            </div>
                                            {entry.task && (
                                                <div className="mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                                        {entry.task.title}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">
                                                ${((duration / 3600) * (entry.hourly_rate || 0)).toFixed(2)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                ${entry.hourly_rate || 0}/hr
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <div className="text-sm">
                        <span className="font-semibold">{selectedIds.size}</span> entries selected •
                        <span className="font-semibold ml-1">{formatDuration(Math.round(totalSelectedSeconds))}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Import {selectedIds.size} Entries
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
