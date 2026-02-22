'use client';

import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MoreVertical, Pencil, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateTask, deleteTask, createTask } from "@/app/(dashboard)/tasks/actions";
import { EditTaskDialog } from "./edit-task-dialog";
import { toast } from "sonner";
import { TaskTimerButton } from "@/components/time-tracking/task-timer-button";

interface TaskProps {
    task: any;
    projects?: any[];
    onOpenDetail?: (task: any) => void;
}

const priorityConfig = {
    High: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/30', badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    Medium: { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    Low: { border: 'border-l-blue-500', bg: 'bg-blue-50/30 dark:bg-blue-950/20', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
};

const labelColors: Record<string, string> = {
    'Bug': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Feature': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Design': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    'Research': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Meeting': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Urgent': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Review': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

function getSmartDate(dateStr: string, status: string) {
    const date = parseISO(dateStr);
    const overdue = isPast(date) && status !== 'Done';

    if (isToday(date)) return { text: 'Today', className: overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-medium' };
    if (isTomorrow(date)) return { text: 'Tomorrow', className: 'text-blue-600 dark:text-blue-400' };
    if (overdue) return { text: format(date, 'MMM d'), className: 'text-red-600 dark:text-red-400 font-semibold' };
    return { text: format(date, 'MMM d'), className: 'text-muted-foreground' };
}

export function TaskCard({ task, projects = [], onOpenDetail }: TaskProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [isDoneState, setIsDoneState] = useState(task.status === 'Done'); // Local state for optimistic update

    const isDone = isDoneState; // Use local state for rendering
    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.Medium;
    const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isDone;

    const handleToggleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = isDone ? 'Todo' : 'Done';
        setIsDoneState(!isDone); // Optimistic UI update

        const result = await updateTask(task.id, { status: newStatus });
        if (result?.error) {
            toast.error(result.error);
            setIsDoneState(isDone); // Revert on error
        } else {
            toast.success(isDone ? "Task marked as todo" : "Task completed! 🎉");
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        const result = await deleteTask(task.id);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Task deleted");
        }
    };

    const handleDuplicate = async () => {
        const formData = new FormData();
        formData.append('title', `${task.title} (Copy)`);
        formData.append('description', task.description || '');
        formData.append('status', task.status);
        formData.append('priority', task.priority);
        if (task.due_date) formData.append('dueDate', task.due_date);
        if (task.project_id) formData.append('projectId', task.project_id);
        if (task.labels) formData.append('labels', task.labels.join(','));
        formData.append('isPersonal', task.is_personal ? 'true' : 'false');

        const result = await createTask(formData);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Task duplicated");
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const result = await updateTask(task.id, { status: newStatus });
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(`Status updated to ${newStatus}`);
        }
    };

    return (
        <>
            <div
                className={`group relative rounded-xl border-l-[3px] ${priority.border} border border-border/60 bg-card hover:bg-accent/30 dark:hover:bg-accent/20 transition-all duration-200 hover:shadow-md ${isDone ? 'opacity-60' : ''} ${isOverdue ? 'ring-1 ring-red-200 dark:ring-red-800/50' : ''}`}
                onClick={() => onOpenDetail?.(task)}
            >
                <div className="p-3.5">
                    {/* Top row: checkbox + title + actions */}
                    <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                            onClick={handleToggleComplete}
                            className={`mt-0.5 flex-shrink-0 h-[18px] w-[18px] rounded-full border-2 transition-all duration-300 flex items-center justify-center ${isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-muted-foreground/40 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                }`}
                        >
                            {isDone && <CheckCircle2 className="h-3 w-3" />}
                        </button>

                        {/* Title + description + assignee */}
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                            <div>
                                <h4 className={`text-sm font-medium leading-tight ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </h4>
                                {task.description && !isDone && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                )}
                            </div>
                            {task.assignee && (
                                <div className="h-6 w-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary" title={`Assigned to ${task.assignee.full_name || 'User'}`}>
                                    {task.assignee.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>

                        {/* Actions - visible on hover */}
                        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isDone && (
                                <TaskTimerButton
                                    taskId={task.id}
                                    taskTitle={task.title}
                                    projectId={task.project_id}
                                    className="h-7 px-2 text-[10px]"
                                />
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
                                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
                                        <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('Todo'); }}>
                                        Mark as To Do
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('In Progress'); }}>
                                        Mark In Progress
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('Done'); }}>
                                        Mark Done
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange('Postponed'); }}>
                                        Postpone
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 dark:text-red-400"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Bottom row: metadata */}
                    <div className="flex items-center gap-2 mt-2.5 ml-[30px] flex-wrap">
                        {/* Priority badge */}
                        <Badge className={`text-[10px] px-1.5 py-0 h-[18px] pointer-events-none ${priority.badge}`} variant="secondary">
                            {task.priority}
                        </Badge>

                        {/* Labels */}
                        {task.labels?.map((label: string) => (
                            <Badge
                                key={label}
                                className={`text-[10px] px-1.5 py-0 h-[18px] pointer-events-none ${labelColors[label] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                variant="secondary"
                            >
                                {label}
                            </Badge>
                        ))}

                        {/* Due date */}
                        {task.due_date && (() => {
                            const smart = getSmartDate(task.due_date, task.status);
                            return (
                                <span className={`flex items-center gap-1 text-[11px] ${smart.className}`}>
                                    <CalendarIcon className="h-3 w-3" />
                                    {smart.text}
                                </span>
                            );
                        })()}

                        {/* Project */}
                        {task.project && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[18px] font-normal truncate max-w-[100px] border-brand-primary/30 text-brand-primary dark:text-brand-primary">
                                {task.project.title}
                            </Badge>
                        )}

                        {/* Overdue indicator */}
                        {isOverdue && (
                            <span className="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 font-semibold">
                                ⚠ Overdue
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditTaskDialog
                task={task}
                projects={projects}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    );
}
