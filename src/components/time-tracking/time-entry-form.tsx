"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { getProjects } from "@/app/(dashboard)/projects/actions";
import { getTasks } from "@/app/(dashboard)/tasks/actions";
import { Project, Task, TimeEntry } from "@/types";

const formSchema = z.object({
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isBillable: z.boolean(),
    hourlyRate: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TimeEntryFormProps {
    initialData?: Partial<TimeEntry>;
    onSubmit: (values: FormValues) => Promise<void>;
    isLoading?: boolean;
    buttonText?: string;
}

export function TimeEntryForm({ initialData, onSubmit, isLoading, buttonText = "Save Entry" }: TimeEntryFormProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: initialData?.project_id || undefined,
            taskId: initialData?.task_id || undefined,
            description: initialData?.description || "",
            date: initialData?.start_time ? new Date(initialData.start_time).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            startTime: initialData?.start_time ? new Date(initialData.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : "09:00",
            endTime: initialData?.end_time ? new Date(initialData.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : "10:00",
            isBillable: initialData?.is_billable ?? true,
            hourlyRate: initialData?.hourly_rate || undefined,
        },
    });

    const selectedProjectId = watch("projectId");

    useEffect(() => {
        const loadData = async () => {
            const projectsData = await getProjects();
            setProjects(projectsData);
        };
        loadData();
    }, []);

    useEffect(() => {
        const loadTasks = async () => {
            if (selectedProjectId) {
                const tasksData = await getTasks({ projectId: selectedProjectId });
                setTasks(tasksData);
            } else {
                setTasks([]);
            }
        };
        loadTasks();
    }, [selectedProjectId]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="projectId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</Label>
                    <Controller
                        name="projectId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taskId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</Label>
                    <Controller
                        name="taskId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={!selectedProjectId}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select task" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tasks.map((task) => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Briefly describe what you did..."
                    className="min-h-[80px] bg-background resize-none"
                    {...register("description")}
                />
                {errors.description && <p className="text-[10px] text-destructive font-medium">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
                    <Input id="date" type="date" className="bg-background" {...register("date")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start</Label>
                    <Input id="startTime" type="time" className="bg-background" {...register("startTime")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End</Label>
                    <Input id="endTime" type="time" className="bg-background" {...register("endTime")} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">Billable Entry</Label>
                        <p className="text-[10px] text-muted-foreground">Include in client invoices</p>
                    </div>
                    <Controller
                        name="isBillable"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-5 w-5 rounded-md border-muted-foreground/30 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <div className="relative">
                        <Label htmlFor="hourlyRate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Rate (Optional)</Label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">$</span>
                            <Input
                                id="hourlyRate"
                                type="number"
                                step="0.01"
                                placeholder="Auto"
                                className="pl-7 bg-background h-11"
                                {...register("hourlyRate")}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                    </>
                ) : buttonText}
            </Button>
        </form>
    );
}
