"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { TimeEntry } from "@/types";
import { getActiveTimer, startTimeEntry, stopTimeEntry } from "@/app/(dashboard)/time-tracking/actions";
import { toast } from "sonner";

interface TimeTrackerContextType {
    activeTimer: TimeEntry | null;
    elapsedSeconds: number;
    isLoading: boolean;
    startTimer: (data: { projectId?: string; taskId?: string; description?: string }) => Promise<void>;
    stopTimer: () => Promise<void>;
    refreshTimer: () => Promise<void>;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
    const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTimer = useCallback(async () => {
        try {
            const timer = await getActiveTimer();
            setActiveTimer(timer);
            if (timer) {
                const start = new Date(timer.start_time).getTime();
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - start) / 1000));
            } else {
                setElapsedSeconds(0);
            }
        } catch (error) {
            console.error("Failed to refresh timer:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshTimer();
    }, [refreshTimer]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTimer) {
            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const startTimer = async (data: { projectId?: string; taskId?: string; description?: string }) => {
        setIsLoading(true);
        try {
            await startTimeEntry(data);
            await refreshTimer();
            toast.success("Timer started");
        } catch (error) {
            toast.error("Failed to start timer");
        } finally {
            setIsLoading(false);
        }
    };

    const stopTimer = async () => {
        if (!activeTimer) return;
        setIsLoading(true);
        try {
            await stopTimeEntry(activeTimer.id);
            setActiveTimer(null);
            setElapsedSeconds(0);
            toast.success("Timer stopped and saved");
        } catch (error) {
            toast.error("Failed to stop timer");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TimeTrackerContext.Provider
            value={{
                activeTimer,
                elapsedSeconds,
                isLoading,
                startTimer,
                stopTimer,
                refreshTimer,
            }}
        >
            {children}
        </TimeTrackerContext.Provider>
    );
}

export function useTimeTracker() {
    const context = useContext(TimeTrackerContext);
    if (context === undefined) {
        throw new Error("useTimeTracker must be used within a TimeTrackerProvider");
    }
    return context;
}
