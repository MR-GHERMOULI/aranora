"use client";

import { useTimeTracker } from "./time-tracker-provider";
import { formatDuration, cn } from "@/lib/utils";
import { Play, Square, Pause, Timer, Briefcase, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function TimerBar() {
    const { activeTimer, elapsedSeconds, stopTimer, isLoading } = useTimeTracker();

    if (!activeTimer) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-[600px]"
            >
                <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md bg-opacity-95">
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <div className="bg-primary/20 p-2 rounded-xl text-primary animate-pulse">
                            <Timer className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-white truncate">
                                {activeTimer.description || "No description"}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {activeTimer.project && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{activeTimer.project.title}</span>
                                    </div>
                                )}
                                {activeTimer.task && (
                                    <div className="flex items-center gap-1">
                                        <ListTodo className="h-3 w-3" />
                                        <span>{activeTimer.task.title}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-2xl font-mono font-bold text-white tabular-nums">
                            {formatDuration(elapsedSeconds)}
                        </div>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-12 w-12 rounded-xl shadow-lg hover:scale-105 transition-transform"
                            onClick={stopTimer}
                            disabled={isLoading}
                        >
                            <Square className="h-6 w-6 fill-white" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
