"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { updateTimeEntry } from "@/app/(dashboard)/time-tracking/actions";
import { toast } from "sonner";
import { TimeEntryForm } from "./time-entry-form";
import { TimeEntry } from "@/types";

interface EditEntryDialogProps {
    entry: TimeEntry;
}

export function EditEntryDialog({ entry }: EditEntryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function onSubmit(values: any) {
        setIsLoading(true);
        try {
            const startDateTime = new Date(`${values.date}T${values.startTime}`);
            const endDateTime = new Date(`${values.date}T${values.endTime}`);

            if (endDateTime <= startDateTime) {
                toast.error("End time must be after start time");
                return;
            }

            await updateTimeEntry(entry.id, {
                project_id: values.projectId,
                task_id: values.taskId,
                description: values.description,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                is_billable: values.isBillable,
            });

            toast.success("Time entry updated successfully");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update time entry");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Time Entry</DialogTitle>
                </DialogHeader>
                <TimeEntryForm initialData={entry} onSubmit={onSubmit} isLoading={isLoading} buttonText="Update Entry" />
            </DialogContent>
        </Dialog>
    );
}
