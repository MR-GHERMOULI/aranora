'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createTask } from "@/app/(dashboard)/tasks/actions";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
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

const LABEL_OPTIONS = ['Bug', 'Feature', 'Design', 'Research', 'Meeting', 'Urgent', 'Review'];

export function CreateTaskDialog({ projects, teamMembers }: { projects: any[], teamMembers?: any[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [status, setStatus] = useState('Todo');
    const [priority, setPriority] = useState('Medium');
    const [projectId, setProjectId] = useState('none');
    const [recurrence, setRecurrence] = useState('none');
    const [assigneeId, setAssigneeId] = useState('unassigned');

    const toggleLabel = (label: string) => {
        setSelectedLabels(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const resetForm = () => {
        setDate(undefined);
        setSelectedLabels([]);
        setStatus('Todo');
        setPriority('Medium');
        setProjectId('none');
        setRecurrence('none');
        setAssigneeId('unassigned');
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        formData.set('status', status);
        formData.set('priority', priority);
        if (date) formData.set('dueDate', format(date, 'yyyy-MM-dd'));
        if (projectId !== 'none') formData.set('projectId', projectId);
        if (selectedLabels.length > 0) formData.set('labels', selectedLabels.join(','));
        if (recurrence !== 'none') formData.set('recurrenceType', recurrence);
        if (assigneeId !== 'unassigned') formData.set('assignedTo', assigneeId);
        formData.set('isPersonal', projectId === 'none' ? 'true' : 'false');

        const result = await createTask(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Task created successfully");
            setOpen(false);
            resetForm();
        }

        setIsLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <Plus className="h-4 w-4" /> Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Create New Task
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details below to organize your next task.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar px-6">
                    <form action={handleSubmit} id="create-task-form" className="space-y-6 py-4">
                        {/* Title & Description Section */}
                        <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                                    Title <span className="text-primary">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="e.g., Design new landing page"
                                    required
                                    className="h-11 bg-background border-border/60 focus:border-primary/50 transition-colors text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="flex min-h-[90px] w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                                    placeholder="Add context or notes..."
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
                                        <SelectItem value="Low">🟢 Low</SelectItem>
                                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                                        <SelectItem value="High">🔴 High</SelectItem>
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
                                        <SelectItem value="unassigned">Unassigned (Me)</SelectItem>
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

                <DialogFooter className="p-6 pt-4 bg-muted/20 border-t border-border/40">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="hover:bg-background"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-task-form"
                        disabled={isLoading}
                        className="gap-2 px-6 shadow-md hover:shadow-lg transition-all"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
