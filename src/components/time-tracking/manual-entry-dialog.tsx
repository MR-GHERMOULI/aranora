"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createTimeEntry } from "@/app/(dashboard)/time-tracking/actions";
import { toast } from "sonner";
import { TimeEntryForm } from "./time-entry-form";

export function ManualEntryDialog() {
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

            await createTimeEntry({
                projectId: values.projectId,
                taskId: values.taskId,
                description: values.description,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                isBillable: values.isBillable,
            });

            toast.success("Time entry added successfully");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to add time entry");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Manual Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Manual Time Entry</DialogTitle>
                </DialogHeader>
                <TimeEntryForm onSubmit={onSubmit} isLoading={isLoading} />
            </DialogContent>
        </Dialog>
    );
}
