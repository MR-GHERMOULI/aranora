"use client";

import { useTimeTracker } from "./time-tracker-provider";
import { usePiPTimer } from "@/hooks/use-pip-timer";
import { formatDuration, cn } from "@/lib/utils";
import { Square, Timer, Briefcase, ListTodo, PictureInPicture2, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TimerBar() {
    const { activeTimer, elapsedSeconds, stopTimer, isLoading } = useTimeTracker();

    const handleStopTimer = useCallback(() => {
        stopTimer();
    }, [stopTimer]);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [siteName, setSiteName] = useState<string>("Aranora");

    useEffect(() => {
        const fetchBranding = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single();
            if (data?.value?.logo_url) {
                setLogoUrl(data.value.logo_url);
            }
            if (data?.value?.site_name) {
                setSiteName(data.value.site_name);
            }
        };
        fetchBranding();
    }, []);

    const {
        isPiPActive,
        isPiPSupported,
        openPiP,
        closePiP,
    } = usePiPTimer(handleStopTimer);

    if (!activeTimer) return null;

    const handleTogglePiP = async () => {
        if (isPiPActive) {
            closePiP();
        } else {
            await openPiP(
                {
                    projectName: activeTimer.project?.title,
                    taskName: activeTimer.task?.title,
                    description: activeTimer.description || undefined,
                    logoUrl: logoUrl || undefined,
                    siteName,
                },
                elapsedSeconds
            );
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
                    isPiPActive
                        ? "w-auto"
                        : "w-[90%] md:w-[600px]"
                )}
            >
                {isPiPActive ? (
                    /* Collapsed state when PiP is active */
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-md bg-opacity-95"
                    >
                        <div className="bg-amber-500/20 p-1.5 rounded-lg">
                            <Timer className="h-4 w-4 text-amber-400 animate-pulse" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                            Timer floating
                        </span>
                        <div className="text-sm font-mono font-bold text-white tabular-nums">
                            {formatDuration(elapsedSeconds)}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={handleTogglePiP}
                            title="Bring timer back"
                        >
                            <ArrowDownToLine className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-lg shadow-lg"
                            onClick={stopTimer}
                            disabled={isLoading}
                            title="Stop timer"
                        >
                            <Square className="h-3.5 w-3.5 fill-white" />
                        </Button>
                    </motion.div>
                ) : (
                    /* Full state when PiP is not active */
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

                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-mono font-bold text-white tabular-nums">
                                {formatDuration(elapsedSeconds)}
                            </div>

                            {/* Pop Out / PiP button — hidden on mobile and when unsupported */}
                            {isPiPSupported && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden sm:flex h-12 w-12 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                                    onClick={handleTogglePiP}
                                    title="Pop out timer — floats above other apps"
                                >
                                    <PictureInPicture2 className="h-5 w-5" />
                                </Button>
                            )}

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
                )}
            </motion.div>
        </AnimatePresence>
    );
}
