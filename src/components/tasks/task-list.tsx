'use client';

import { TaskCard } from './task-card';
import { isToday, isThisWeek, isFuture, parseISO } from 'date-fns';

interface TaskListProps {
    tasks: any[];
}

export function TaskList({ tasks }: TaskListProps) {
    // Sort tasks by due date first? Actually action sorts them generally.

    const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
    const weekTasks = tasks.filter(t => t.due_date && isThisWeek(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));
    const laterTasks = tasks.filter(t => !t.due_date || (isFuture(parseISO(t.due_date)) && !isThisWeek(parseISO(t.due_date))));
    // Also handle overdue tasks - maybe put them in "Today" or separate "Overdue"?
    // For simplicity, "Today" includes anything due today or earlier that isn't done? 
    // Let's stick to strict grouping for now, maybe add "Overdue" group if needed.
    // Actually, let's group Overdue with Today for urgency.
    const overdueOrToday = tasks.filter(t => t.due_date && (isToday(parseISO(t.due_date)) || (new Date(t.due_date) < new Date() && t.status !== 'Done')));

    // Re-filtering to avoid duplicates if I changed logic
    // Let's keep it simple:
    // 1. Overdue & Today
    // 2. This Week (excluding today)
    // 3. Later (or no date)

    const group1 = tasks.filter(t => {
        if (!t.due_date) return false;
        const d = parseISO(t.due_date);
        return isToday(d) || (d < new Date() && t.status !== 'Done');
    });

    const group2 = tasks.filter(t => {
        if (!t.due_date) return false;
        const d = parseISO(t.due_date);
        return isThisWeek(d) && !isToday(d) && d > new Date(); // Future within week
    });

    const group3 = tasks.filter(t => !t.due_date || (!group1.includes(t) && !group2.includes(t)));

    return (
        <div className="space-y-8">
            {group1.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600">
                        Today & Overdue
                        <span className="text-xs font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{group1.length}</span>
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group1.map(task => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>
            )}

            {group2.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-600">
                        This Week
                        <span className="text-xs font-normal bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{group2.length}</span>
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group2.map(task => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>
            )}

            {group3.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-600">
                        Later / No Date
                        <span className="text-xs font-normal bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{group3.length}</span>
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group3.map(task => <TaskCard key={task.id} task={task} />)}
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No tasks found. Create one to get started!
                </div>
            )}
        </div>
    );
}
