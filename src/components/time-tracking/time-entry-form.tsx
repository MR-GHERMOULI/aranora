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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="projectId">Project</Label>
                <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
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
            <div className="grid gap-2">
                <Label htmlFor="taskId">Task</Label>
                <Controller
                    name="taskId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!selectedProjectId}
                        >
                            <SelectTrigger>
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
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="What did you work on?"
                    {...register("description")}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" {...register("date")} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" {...register("startTime")} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" {...register("endTime")} />
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonText}
            </Button>
        </form>
    );
}
