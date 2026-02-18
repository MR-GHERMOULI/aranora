'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { TaskCard } from "./task-card";
import { format, isSameDay, parseISO, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2 } from "lucide-react";

interface TaskCalendarProps {
    tasks: any[];
    projects?: any[];
}

export function TaskCalendar({ tasks, projects = [] }: TaskCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const selectedTasks = tasks.filter(t =>
        t.due_date && date && isSameDay(parseISO(t.due_date), date)
    );

    // Build modifiers for calendar day styling
    const taskDays = tasks
        .filter(t => t.due_date)
        .map(t => parseISO(t.due_date));

    const highPriorityDays = tasks
        .filter(t => t.due_date && t.priority === 'High' && t.status !== 'Done')
        .map(t => parseISO(t.due_date));

    const doneDays = tasks
        .filter(t => t.due_date && t.status === 'Done')
        .map(t => parseISO(t.due_date));

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Calendar */}
            <Card className="flex-shrink-0 w-fit h-fit shadow-sm">
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border-0"
                        modifiers={{
                            hasTask: taskDays,
                            hasHighPriority: highPriorityDays,
                            allDone: doneDays,
                        }}
                        modifiersStyles={{
                            hasTask: {
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                                color: 'var(--primary)',
                            },
                            hasHighPriority: {
                                color: 'var(--destructive)',
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                            },
                            allDone: {
                                color: 'var(--brand-secondary-dark)',
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                            },
                        }}
                    />
                </CardContent>
            </Card>

            {/* Selected day tasks */}
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="text-lg font-semibold">
                            {date ? (isToday(date) ? 'Today' : format(date, "EEEE, MMMM d")) : "Select a Date"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} scheduled
                        </p>
                    </div>
                    {selectedTasks.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                            {selectedTasks.filter(t => t.status === 'Done').length}/{selectedTasks.length} done
                        </Badge>
                    )}
                </div>

                {selectedTasks.length > 0 ? (
                    <div className="space-y-2">
                        {selectedTasks.map(task => (
                            <TaskCard key={task.id} task={task} projects={projects} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 border rounded-xl border-dashed text-center bg-muted/20">
                        <div className="rounded-xl bg-muted/50 p-4 mb-3">
                            <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">No tasks due on this date</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Select a different date or create a task</p>
                    </div>
                )}
            </div>
        </div>
    );
}
