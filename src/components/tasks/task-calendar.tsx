'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { TaskCard } from "./task-card";
import { format, isSameDay, parseISO } from "date-fns";

interface TaskCalendarProps {
    tasks: any[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const selectedTasks = tasks.filter(t =>
        t.due_date && date && isSameDay(parseISO(t.due_date), date)
    );

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <Card className="flex-shrink-0 w-fit h-fit">
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiers={{
                            hasTask: (d) => tasks.some(t => t.due_date && isSameDay(parseISO(t.due_date), d))
                        }}
                        modifiersStyles={{
                            hasTask: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                        }}
                    />
                </CardContent>
            </Card>

            <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">
                    Tasks for {date ? format(date, "PPPP") : "Selected Date"}
                </h3>
                {selectedTasks.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {selectedTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                ) : (
                    <div className="text-muted-foreground py-8 border rounded-lg border-dashed text-center">
                        No tasks due on this date.
                    </div>
                )}
            </div>
        </div>
    );
}
