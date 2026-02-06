'use client';

import { useState } from 'react';
import { TaskCard } from './task-card';
import { updateTask } from '@/app/(dashboard)/tasks/actions';
// import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskBoardProps {
    tasks: any[];
}

const COLUMNS = [
    { id: 'Todo', label: 'To Do', color: 'bg-slate-100 border-slate-200' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-blue-50 border-blue-100' },
    { id: 'Done', label: 'Done', color: 'bg-green-50 border-green-100' },
    { id: 'Postponed', label: 'Postponed', color: 'bg-orange-50 border-orange-100' },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
    const [localTasks, setLocalTasks] = useState(tasks);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const getTasksByStatus = (status: string) => {
        return localTasks.filter((task) => task.status === status);
    };

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        setDraggingTaskId(taskId);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
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

        // Server Action
        await updateTask(taskId, { status });
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
                <div
                    key={column.id}
                    className={`flex-shrink-0 w-80 rounded-xl border ${column.color} flex flex-col`}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, column.id)}
                >
                    <div className="p-3 font-semibold text-sm flex items-center justify-between">
                        {column.label}
                        <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                            {getTasksByStatus(column.id).length}
                        </span>
                    </div>
                    <div className="flex-1 p-3 pt-0 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3 min-h-[100px]">
                            {getTasksByStatus(column.id).map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, task.id)}
                                    className={`transition-opacity ${draggingTaskId === task.id ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <TaskCard task={task} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
