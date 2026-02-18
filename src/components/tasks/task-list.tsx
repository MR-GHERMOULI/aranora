'use client';

import { TaskCard } from './task-card';
import { isToday, isTomorrow, isThisWeek, isFuture, isPast, parseISO } from 'date-fns';
import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertTriangle, Calendar, Inbox } from 'lucide-react';

interface TaskListProps {
    tasks: any[];
    projects?: any[];
}

interface TaskGroup {
    id: string;
    label: string;
    icon: any;
    color: string;
    tasks: any[];
    defaultOpen: boolean;
}

export function TaskList({ tasks, projects = [] }: TaskListProps) {
    const activeTasks = tasks.filter(t => t.status !== 'Done');
    const doneTasks = tasks.filter(t => t.status === 'Done');

    // Smart grouping
    const overdueTasks = activeTasks.filter(t =>
        t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
    );

    const todayTasks = activeTasks.filter(t =>
        t.due_date && isToday(parseISO(t.due_date))
    );

    const tomorrowTasks = activeTasks.filter(t =>
        t.due_date && isTomorrow(parseISO(t.due_date))
    );

    const weekTasks = activeTasks.filter(t => {
        if (!t.due_date) return false;
        const d = parseISO(t.due_date);
        return isThisWeek(d) && !isToday(d) && !isTomorrow(d) && !isPast(d);
    });

    const laterTasks = activeTasks.filter(t => {
        if (!t.due_date) return false;
        const d = parseISO(t.due_date);
        return isFuture(d) && !isThisWeek(d);
    });

    const noDateTasks = activeTasks.filter(t => !t.due_date);

    const groups: TaskGroup[] = [
        { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', tasks: overdueTasks, defaultOpen: true },
        { id: 'today', label: 'Today', icon: Clock, color: 'text-amber-600 dark:text-amber-400', tasks: todayTasks, defaultOpen: true },
        { id: 'tomorrow', label: 'Tomorrow', icon: Calendar, color: 'text-blue-600 dark:text-blue-400', tasks: tomorrowTasks, defaultOpen: true },
        { id: 'week', label: 'This Week', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', tasks: weekTasks, defaultOpen: true },
        { id: 'later', label: 'Later', icon: Calendar, color: 'text-slate-500 dark:text-slate-400', tasks: laterTasks, defaultOpen: false },
        { id: 'nodate', label: 'No Date', icon: Inbox, color: 'text-muted-foreground', tasks: noDateTasks, defaultOpen: false },
    ].filter(g => g.tasks.length > 0);

    return (
        <div className="space-y-6 pb-6">
            {groups.map(group => (
                <TaskGroupSection key={group.id} group={group} projects={projects} />
            ))}

            {/* Completed section */}
            {doneTasks.length > 0 && (
                <TaskGroupSection
                    group={{
                        id: 'done',
                        label: `Completed`,
                        icon: CheckCircle2,
                        color: 'text-emerald-600 dark:text-emerald-400',
                        tasks: doneTasks,
                        defaultOpen: false,
                    }}
                    projects={projects}
                />
            )}

            {/* Empty state */}
            {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-2xl bg-muted/50 p-6 mb-4">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No tasks yet</h3>
                    <p className="text-muted-foreground text-sm max-w-[300px]">
                        Create your first task to start organizing your work and boosting your productivity.
                    </p>
                </div>
            )}
        </div>
    );
}

function TaskGroupSection({ group, projects }: { group: TaskGroup; projects: any[] }) {
    const [isOpen, setIsOpen] = useState(group.defaultOpen);
    const Icon = group.icon;

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 mb-3 group/header w-full text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Icon className={`h-4 w-4 ${group.color}`} />
                <span className={`text-sm font-semibold ${group.color}`}>
                    {group.label}
                </span>
                <span className={`text-xs font-normal px-2 py-0.5 rounded-full bg-muted ${group.color}`}>
                    {group.tasks.length}
                </span>
            </button>
            {isOpen && (
                <div className="space-y-2 ml-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    {group.tasks.map(task => (
                        <TaskCard key={task.id} task={task} projects={projects} />
                    ))}
                </div>
            )}
        </div>
    );
}
