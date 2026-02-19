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

export function CreateTaskDialog({ projects }: { projects: any[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [status, setStatus] = useState('Todo');
    const [priority, setPriority] = useState('Medium');
    const [projectId, setProjectId] = useState('none');
    const [recurrence, setRecurrence] = useState('none');

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
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        formData.set('status', status);
        formData.set('priority', priority);
        if (date) formData.set('dueDate', format(date, 'yyyy-MM-dd'));
        if (projectId !== 'none') formData.set('projectId', projectId);
        if (selectedLabels.length > 0) formData.set('labels', selectedLabels.join(','));
        if (recurrence !== 'none') formData.set('recurrenceType', recurrence);
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your to-do list.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
                        <Input id="title" name="title" placeholder="What needs to be done?" required className="h-10" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Add some details..."
                        />
                    </div>

                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todo">To Do</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                    <SelectItem value="Postponed">Postponed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">🟢 Low</SelectItem>
                                    <SelectItem value="Medium">🟡 Medium</SelectItem>
                                    <SelectItem value="High">🔴 High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due Date + Project */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Personal)</SelectItem>
                                    {projects.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-2">
                        <Label>Repeat</Label>
                        <Select value={recurrence} onValueChange={setRecurrence}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No repeat</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Labels */}
                    <div className="space-y-2">
                        <Label>Labels</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {LABEL_OPTIONS.map(label => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => toggleLabel(label)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${selectedLabels.includes(label)
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="gap-2">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
