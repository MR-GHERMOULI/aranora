'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskList } from "@/components/tasks/task-list";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { TaskStats } from "@/components/tasks/task-stats";
import { TaskFilters, FilterState } from "@/components/tasks/task-filters";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { List, LayoutGrid, CalendarDays } from "lucide-react";

interface TasksClientProps {
    tasks: any[];
    projects: any[];
    stats: {
        total: number;
        completed: number;
        overdue: number;
        dueToday: number;
        inProgress: number;
    };
}

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export function TasksClient({ tasks, projects, stats }: TasksClientProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        status: 'All',
        priority: 'All',
        sortBy: 'due_date',
    });
    const [detailTask, setDetailTask] = useState<any | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Client-side filtering
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (filters.status !== 'All') {
            result = result.filter(t => t.status === filters.status);
        }

        // Priority filter
        if (filters.priority !== 'All') {
            result = result.filter(t => t.priority === filters.priority);
        }

        // Sort
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'priority':
                    return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'created_at':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'due_date':
                default:
                    if (!a.due_date && !b.due_date) return 0;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
        });

        return result;
    }, [tasks, filters]);

    const openDetail = (task: any) => {
        setDetailTask(task);
        setDetailOpen(true);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 lg:p-8 gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        To-Do List
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Organize, prioritize, and track your tasks efficiently.
                    </p>
                </div>
                <CreateTaskDialog projects={projects} />
            </div>

            {/* Stats */}
            <TaskStats stats={stats} />

            {/* Filters */}
            <TaskFilters activeFilters={filters} onFilterChange={setFilters} />

            {/* Tabs */}
            <Tabs defaultValue="list" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="list" className="gap-2 text-xs data-[state=active]:shadow-sm">
                            <List className="h-3.5 w-3.5" />
                            List
                        </TabsTrigger>
                        <TabsTrigger value="board" className="gap-2 text-xs data-[state=active]:shadow-sm">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Board
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2 text-xs data-[state=active]:shadow-sm">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Calendar
                        </TabsTrigger>
                    </TabsList>
                    <p className="text-xs text-muted-foreground">
                        {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                        {filters.status !== 'All' || filters.priority !== 'All' || filters.search ? ' (filtered)' : ''}
                    </p>
                </div>

                <TabsContent value="list" className="flex-1 overflow-y-auto no-scrollbar">
                    <TaskList tasks={filteredTasks} projects={projects} />
                </TabsContent>

                <TabsContent value="board" className="flex-1 overflow-hidden h-full">
                    <TaskBoard tasks={filteredTasks} projects={projects} />
                </TabsContent>

                <TabsContent value="calendar" className="flex-1 overflow-y-auto no-scrollbar">
                    <TaskCalendar tasks={filteredTasks} projects={projects} />
                </TabsContent>
            </Tabs>

            {/* Detail Panel */}
            <TaskDetailPanel
                task={detailTask}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                projects={projects}
            />
        </div>
    );
}
