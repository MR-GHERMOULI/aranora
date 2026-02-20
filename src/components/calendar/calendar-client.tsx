"use client";

import { useState, useMemo } from "react";
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay,
    isToday, isPast, addDays
} from "date-fns";
import { CalendarEvent } from "@/app/(dashboard)/calendar/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, ChevronRight, CalendarDays, Plus,
    ListTodo, FileText, Briefcase, X, Clock, AlertCircle
} from "lucide-react";
import { AddTaskDialog } from "@/components/calendar/add-task-dialog";
import { TaskItem } from "@/components/calendar/task-item";
import { Project } from "@/types";
import Link from "next/link";

interface CalendarClientProps {
    events: CalendarEvent[];
    tasks: any[];
    projects: Project[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({ events, tasks, projects }: CalendarClientProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<"month" | "week">("month");

    // Build date grid for the month
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [currentMonth]);

    // Week view days
    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentMonth);
        return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    }, [currentMonth]);

    const displayDays = viewMode === "month" ? calendarDays : weekDays;

    // Get events for a specific day
    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, day);
        });
    };

    // Get selected day's events
    const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
    const selectedDayTasks = selectedDate
        ? tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate))
        : [];

    const goToToday = () => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    };

    // Stats
    const totalEvents = events.length;
    const todayEvents = events.filter(e => isToday(new Date(e.date))).length;
    const overdueEvents = events.filter(e => {
        const d = new Date(e.date);
        return isPast(d) && !isToday(d) && e.status !== 'Done' && e.status !== 'Paid' && e.status !== 'Completed';
    }).length;

    const typeIcon = (type: string) => {
        switch (type) {
            case 'task': return <ListTodo className="h-3 w-3" />;
            case 'deadline': return <Briefcase className="h-3 w-3" />;
            case 'invoice': return <FileText className="h-3 w-3" />;
            default: return <CalendarDays className="h-3 w-3" />;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 lg:p-8 gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Calendar
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage your schedule, deadlines, and events.
                    </p>
                </div>
                <AddTaskDialog projects={projects} />
            </div>

            {/* Stats Bar */}
            <div className="grid gap-3 grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Events</p>
                                <p className="text-2xl font-bold">{totalEvents}</p>
                            </div>
                            <CalendarDays className="h-5 w-5 text-blue-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Today</p>
                                <p className="text-2xl font-bold">{todayEvents}</p>
                            </div>
                            <Clock className="h-5 w-5 text-emerald-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                                <p className="text-2xl font-bold">{overdueEvents}</p>
                            </div>
                            <AlertCircle className="h-5 w-5 text-red-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => {
                        setCurrentMonth(prev => viewMode === "month" ? subMonths(prev, 1) : addDays(prev, -7));
                    }}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold min-w-[180px] text-center">
                        {viewMode === "month"
                            ? format(currentMonth, "MMMM yyyy")
                            : `${format(startOfWeek(currentMonth), "MMM d")} - ${format(endOfWeek(currentMonth), "MMM d, yyyy")}`
                        }
                    </h2>
                    <Button variant="outline" size="icon" onClick={() => {
                        setCurrentMonth(prev => viewMode === "month" ? addMonths(prev, 1) : addDays(prev, 7));
                    }}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2 text-xs">
                        Today
                    </Button>
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <Button
                        variant={viewMode === "month" ? "default" : "ghost"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setViewMode("month")}
                    >
                        Month
                    </Button>
                    <Button
                        variant={viewMode === "week" ? "default" : "ghost"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setViewMode("week")}
                    >
                        Week
                    </Button>
                </div>
            </div>

            {/* Calendar Grid + Sidebar */}
            <div className="flex-1 grid gap-4 lg:grid-cols-[1fr_320px] overflow-hidden">
                {/* Calendar Grid */}
                <Card className="overflow-hidden flex flex-col">
                    <CardContent className="p-0 flex-1 flex flex-col">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 border-b">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className={`grid grid-cols-7 flex-1 ${viewMode === "week" ? "" : "auto-rows-fr"}`}>
                            {displayDays.map((day, i) => {
                                const dayEvents = getEventsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const today = isToday(day);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            relative p-1.5 border-b border-r text-left transition-colors min-h-[80px]
                                            hover:bg-accent/60 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-inset
                                            ${!isCurrentMonth && viewMode === "month" ? "bg-muted/30 text-muted-foreground/50" : ""}
                                            ${isSelected ? "bg-accent ring-1 ring-brand-primary/30" : ""}
                                        `}
                                    >
                                        <span className={`
                                            text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                                            ${today ? "bg-brand-primary text-white" : ""}
                                        `}>
                                            {format(day, "d")}
                                        </span>

                                        {/* Event dots */}
                                        {dayEvents.length > 0 && (
                                            <div className="mt-1 space-y-0.5">
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div
                                                        key={event.id}
                                                        className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                                                        style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[10px] text-muted-foreground px-1">
                                                        +{dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Day Detail Sidebar */}
                <Card className="overflow-hidden flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                                {selectedDate
                                    ? format(selectedDate, "EEEE, MMMM d")
                                    : "Select a day"
                                }
                            </CardTitle>
                            {selectedDate && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {!selectedDate ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Click a day to see its events</p>
                            </div>
                        ) : selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No events</p>
                                <p className="text-xs mt-1">This day is free. Add a task?</p>
                            </div>
                        ) : (
                            <>
                                {/* Calendar Events (non-task) */}
                                {selectedDayEvents.filter(e => e.type !== 'task').map(event => (
                                    <div
                                        key={event.id}
                                        className="p-3 rounded-lg border hover:bg-accent/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${event.color}20` }}
                                            >
                                                <span style={{ color: event.color }}>{typeIcon(event.type)}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {event.link ? (
                                                    <Link href={event.link} className="text-sm font-medium truncate block hover:text-brand-primary transition-colors">
                                                        {event.title}
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-medium truncate">{event.title}</p>
                                                )}
                                                {event.status && (
                                                    <Badge variant="outline" className="text-[10px] mt-1 h-4">{event.status}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Tasks */}
                                {selectedDayTasks.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tasks</p>
                                        <div className="space-y-2">
                                            {selectedDayTasks.map((task: any) => (
                                                <TaskItem key={task.id} task={task} projects={projects} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
