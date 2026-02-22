'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Calendar, Clock, Flag, FolderOpen, Tag, Pencil, Trash2, Repeat } from "lucide-react";
import { useState } from "react";
import { updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions";
import { EditTaskDialog } from "./edit-task-dialog";

interface TaskDetailPanelProps {
    task: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects?: any[];
    teamMembers?: any[];
}

const priorityConfig = {
    High: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', label: '🔴 High' },
    Medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', label: '🟡 Medium' },
    Low: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', label: '🟢 Low' },
};

const statusConfig = {
    Todo: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'To Do' },
    'In Progress': { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', label: 'In Progress' },
    Done: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Done' },
    Postponed: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', label: 'Postponed' },
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

export function TaskDetailPanel({ task, open, onOpenChange, projects = [], teamMembers = [] }: TaskDetailPanelProps) {
    const [editOpen, setEditOpen] = useState(false);

    if (!task) return null;

    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.Medium;
    const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.Todo;
    const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Done';
    const isDueToday = task.due_date && isToday(parseISO(task.due_date));

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        await deleteTask(task.id);
        onOpenChange(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        await updateTask(task.id, { status: newStatus });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <DialogTitle className={`text-xl leading-tight ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                            </DialogTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${status.bg} ${status.color} border-0`}>{status.label}</Badge>
                            <Badge className={`${priority.bg} ${priority.color} border-0`}>{priority.label}</Badge>
                            {isOverdue && <Badge variant="destructive" className="text-xs">⚠ Overdue</Badge>}
                            {isDueToday && !isOverdue && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-xs">Due Today</Badge>}
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Description */}
                        {task.description && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/30">
                                    {task.description}
                                </p>
                            </div>
                        )}

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {task.due_date && (
                                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                                    <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {task.project && (
                                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Project</p>
                                        <p className="text-sm font-medium">{task.project.title}</p>
                                    </div>
                                </div>
                            )}
                            {task.assignee && (
                                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                        {task.assignee.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Assignee</p>
                                        <p className="text-sm font-medium">{task.assignee.full_name || task.assignee.username || 'Unassigned'}</p>
                                    </div>
                                </div>
                            )}
                            {task.recurrence && (
                                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Repeat</p>
                                        <p className="text-sm font-medium capitalize">{task.recurrence.type}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/30">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm font-medium">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Labels */}
                        {task.labels?.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</h4>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {task.labels.map((label: string) => (
                                        <Badge
                                            key={label}
                                            className={`text-xs px-2 py-0.5 ${labelColors[label] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'} border-0`}
                                        >
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick status change */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Status</h4>
                            <div className="flex gap-1.5">
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusChange(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${task.status === key
                                            ? `${config.bg} ${config.color} border-current shadow-sm`
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-accent'
                                            }`}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 gap-2"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                        <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                            <Pencil className="h-4 w-4" /> Edit Task
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <EditTaskDialog
                task={task}
                projects={projects}
                teamMembers={teamMembers}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    );
}
