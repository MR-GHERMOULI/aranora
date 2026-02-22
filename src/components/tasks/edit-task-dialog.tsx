'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions";
import { Loader2, CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EditTaskDialogProps {
    task: any;
    projects: any[];
    teamMembers?: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const LABEL_OPTIONS = ['Bug', 'Feature', 'Design', 'Research', 'Meeting', 'Urgent', 'Review'];

export function EditTaskDialog({ task, projects, teamMembers, open, onOpenChange }: EditTaskDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [date, setDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority || 'Medium');
    const [projectId, setProjectId] = useState(task.project_id || 'none');
    const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);
    const [recurrence, setRecurrence] = useState(task.recurrence?.type || 'none');
    const [assigneeId, setAssigneeId] = useState(task.assigned_to || 'unassigned');

    const toggleLabel = (label: string) => {
        setSelectedLabels(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const result = await updateTask(task.id, {
            title,
            description,
            status,
            priority,
            due_date: date ? format(date, 'yyyy-MM-dd') : null,
            project_id: projectId === 'none' ? null : projectId,
            labels: selectedLabels,
            recurrence: recurrence !== 'none' ? { type: recurrence } : null,
            assigned_to: assigneeId !== 'unassigned' ? assigneeId : null,
        });

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Task updated successfully");
            onOpenChange(false);
        }

        setIsLoading(false);
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this task?')) return;
        setIsDeleting(true);
        const result = await deleteTask(task.id);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Task deleted");
            onOpenChange(false);
        }

        setIsDeleting(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Edit Task
                    </DialogTitle>
                    <DialogDescription>
                        Update the task details below to keep your list accurate.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar px-6">
                    <form onSubmit={handleSubmit} id="edit-task-form" className="space-y-6 py-4">
                        {/* Title & Description Section */}
                        <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="h-11 bg-background border-border/60 focus:border-primary/50 transition-colors text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Description</Label>
                                <textarea
                                    id="edit-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="flex min-h-[90px] w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                                    placeholder="Add details..."
                                />
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todo">To Do</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Done">Done</SelectItem>
                                        <SelectItem value="Postponed">Postponed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Due Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-10 bg-background/50 border-border/60",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                                            {date ? format(date, "PPP") : <span>No date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Project</Label>
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue placeholder="Personal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Personal)</SelectItem>
                                        {projects.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Assign To</Label>
                                <Select value={assigneeId} onValueChange={setAssigneeId}>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {teamMembers?.map((tm: any) => (
                                            <SelectItem key={tm.user_id} value={tm.user_id}>
                                                {tm.profiles?.full_name || tm.profiles?.email || 'Unknown User'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Repeat</Label>
                                <Select value={recurrence} onValueChange={setRecurrence}>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No repeat</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Labels Section */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Labels</Label>
                            <div className="flex flex-wrap gap-2">
                                {LABEL_OPTIONS.map(label => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => toggleLabel(label)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                            selectedLabels.includes(label)
                                                ? 'bg-primary/15 text-primary border-primary/30 shadow-sm ring-1 ring-primary/20'
                                                : 'bg-background text-muted-foreground border-border/60 hover:border-primary/30 hover:bg-primary/5'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-6 pt-4 bg-muted/20 border-t border-border/40 flex !justify-between items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Task
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-background"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="edit-task-form"
                            disabled={isLoading}
                            className="px-6 shadow-md"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
