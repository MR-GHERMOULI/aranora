"use client";

import { useTimeTracker } from "./time-tracker-provider";
import { Button } from "@/components/ui/button";
import { Timer, StopCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTimerButtonProps {
    projectId: string;
    projectTitle: string;
}

export function ProjectTimerButton({ projectId, projectTitle }: ProjectTimerButtonProps) {
    const { activeTimer, startTimer, stopTimer, isLoading } = useTimeTracker();

    const isActive = activeTimer?.project_id === projectId;
    const isRunningSomewhereElse = activeTimer && activeTimer.project_id !== projectId;

    if (isActive) {
        return (
            <Button
                variant="destructive"
                onClick={stopTimer}
                disabled={isLoading}
                className="gap-2"
            >
                <StopCircle className="h-4 w-4" />
                Stop Timer
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={() => startTimer({
                projectId,
                description: `Working on ${projectTitle}`
            })}
            disabled={isLoading}
            className={cn("gap-2 border-amber-500 text-amber-600 hover:bg-amber-50", isRunningSomewhereElse && "opacity-50")}
        >
            <Play className="h-4 w-4 fill-current" />
            {isRunningSomewhereElse ? "Switch Timer" : "Start Timer"}
        </Button>
    );
}
