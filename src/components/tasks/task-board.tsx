'use client';

import { useState } from 'react';
import { TaskCard } from './task-card';
import { updateTask } from '@/app/(dashboard)/tasks/actions';
import { Input } from '@/components/ui/input';
import { createTask } from '@/app/(dashboard)/tasks/actions';
import { Plus, Loader2 } from 'lucide-react';

interface TaskBoardProps {
    tasks: any[];
    projects?: any[];
}

const COLUMNS = [
    {
        id: 'Todo',
        label: 'To Do',
        color: 'bg-slate-50 dark:bg-slate-900/50',
        headerColor: 'bg-slate-200 dark:bg-slate-700',
        dotColor: 'bg-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
    },
    {
        id: 'In Progress',
        label: 'In Progress',
        color: 'bg-blue-50/50 dark:bg-blue-950/30',
        headerColor: 'bg-blue-200 dark:bg-blue-800',
        dotColor: 'bg-blue-500',
        borderColor: 'border-blue-200 dark:border-blue-800/50',
    },
    {
        id: 'Done',
        label: 'Done',
        color: 'bg-emerald-50/50 dark:bg-emerald-950/30',
        headerColor: 'bg-emerald-200 dark:bg-emerald-800',
        dotColor: 'bg-emerald-500',
        borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    },
    {
        id: 'Postponed',
        label: 'Postponed',
        color: 'bg-orange-50/50 dark:bg-orange-950/30',
        headerColor: 'bg-orange-200 dark:bg-orange-800',
        dotColor: 'bg-orange-500',
        borderColor: 'border-orange-200 dark:border-orange-800/50',
    },
];

export function TaskBoard({ tasks, projects = [] }: TaskBoardProps) {
    const [localTasks, setLocalTasks] = useState(tasks);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const getTasksByStatus = (status: string) => {
        return localTasks.filter((task) => task.status === status);
    };

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTaskId(taskId);
    };

    const onDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const onDragLeave = () => {
        setDragOverColumn(null);
    };

    const onDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        // Optimistic Update
        const updatedTasks = localTasks.map(t =>
            t.id === taskId ? { ...t, status } : t
        );
        setLocalTasks(updatedTasks);
        setDraggingTaskId(null);
        setDragOverColumn(null);

        // Server Action
        await updateTask(taskId, { status });
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                const isOver = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className={`flex-shrink-0 w-80 rounded-xl border ${column.borderColor} ${column.color} flex flex-col transition-all duration-200 ${isOver ? 'ring-2 ring-primary/40 shadow-lg scale-[1.01]' : ''}`}
                        onDragOver={(e) => onDragOver(e, column.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, column.id)}
                    >
                        {/* Column header */}
                        <div className="p-3 font-semibold text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                                {column.label}
                            </div>
                            <span className="bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium border border-border/40">
                                {columnTasks.length}
                            </span>
                        </div>

                        {/* Progress bar */}
                        {localTasks.length > 0 && (
                            <div className="px-3 pb-2">
                                <div className="w-full h-1 rounded-full bg-background/60 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${column.dotColor}`}
                                        style={{ width: `${(columnTasks.length / Math.max(localTasks.length, 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tasks */}
                        <div className="flex-1 p-3 pt-0 overflow-y-auto no-scrollbar">
                            <div className="space-y-2.5 min-h-[100px]">
                                {columnTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${draggingTaskId === task.id ? 'opacity-30 scale-95' : 'opacity-100'
                                            }`}
                                    >
                                        <TaskCard task={task} projects={projects} />
                                    </div>
                                ))}

                                {/* Drop zone placeholder */}
                                {isOver && columnTasks.length === 0 && (
                                    <div className="border-2 border-dashed border-primary/40 rounded-xl h-24 flex items-center justify-center text-sm text-muted-foreground animate-in fade-in-0 zoom-in-95 duration-200">
                                        Drop here
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick-add at bottom */}
                        <QuickAdd columnStatus={column.id} />
                    </div>
                );
            })}
        </div>
    );
}

function QuickAdd({ columnStatus }: { columnStatus: string }) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('status', columnStatus);
        formData.append('priority', 'Medium');
        formData.append('isPersonal', 'true');
        await createTask(formData);
        setTitle('');
        setLoading(false);
        setIsAdding(false);
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 p-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full border-t border-border/30"
            >
                <Plus className="h-3.5 w-3.5" />
                Add task
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-3 border-t border-border/30">
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="h-8 text-xs"
                autoFocus
                onBlur={() => { if (!title.trim()) setIsAdding(false); }}
                disabled={loading}
            />
            {loading && <Loader2 className="h-3 w-3 animate-spin mt-2 mx-auto text-muted-foreground" />}
        </form>
    );
}
