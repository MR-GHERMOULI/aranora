"use client";

import { useTimeTracker } from "./time-tracker-provider";
import { Button } from "@/components/ui/button";
import { Play, StopCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTimerButtonProps {
    taskId: string;
    taskTitle: string;
    projectId?: string;
    className?: string;
}

export function TaskTimerButton({ taskId, taskTitle, projectId, className }: TaskTimerButtonProps) {
    const { activeTimer, startTimer, stopTimer, isLoading } = useTimeTracker();

    const isActive = activeTimer?.task_id === taskId;
    const isRunningSomewhereElse = activeTimer && activeTimer.task_id !== taskId;

    if (isActive) {
        return (
            <Button
                variant="destructive"
                size="sm"
                onClick={stopTimer}
                disabled={isLoading}
                className={cn("h-8 gap-1 shadow-sm", className)}
            >
                <StopCircle className="h-3.5 w-3.5" />
                Stop
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startTimer({
                    taskId,
                    projectId,
                    description: `Working on: ${taskTitle}`
                });
            }}
            disabled={isLoading}
            className={cn(
                "h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50",
                isRunningSomewhereElse && "opacity-70",
                className
            )}
        >
            <Play className="h-3.5 w-3.5 fill-current" />
            Track
        </Button>
    );
}
