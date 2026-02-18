'use client';

import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface TaskStatsProps {
    stats: {
        total: number;
        completed: number;
        overdue: number;
        dueToday: number;
        inProgress: number;
    };
}

const statCards = [
    {
        key: 'total',
        label: 'Total Tasks',
        icon: ListTodo,
        color: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200/60 dark:border-blue-500/20',
    },
    {
        key: 'dueToday',
        label: 'Due Today',
        icon: Clock,
        color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200/60 dark:border-amber-500/20',
    },
    {
        key: 'completed',
        label: 'Completed',
        icon: CheckCircle2,
        color: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-200/60 dark:border-emerald-500/20',
    },
    {
        key: 'overdue',
        label: 'Overdue',
        icon: AlertTriangle,
        color: 'from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20',
        iconColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-200/60 dark:border-red-500/20',
    },
];

export function TaskStats({ stats }: TaskStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((card) => {
                const Icon = card.icon;
                const value = stats[card.key as keyof typeof stats] ?? 0;
                return (
                    <div
                        key={card.key}
                        className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.color} p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {card.label}
                                </p>
                                <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl bg-background/60 backdrop-blur-sm ${card.iconColor}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                        {/* Decorative circle */}
                        <div className={`absolute -bottom-4 -right-4 h-16 w-16 rounded-full ${card.color} opacity-40`} />
                    </div>
                );
            })}
        </div>
    );
}
