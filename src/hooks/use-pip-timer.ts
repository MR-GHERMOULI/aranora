"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { buildPiPDocument } from "@/components/time-tracking/pip-document-content";
import {
    renderTimerToCanvas,
    createCanvasPiPElements,
} from "@/components/time-tracking/pip-canvas-renderer";

export type PiPSupportTier = "document" | "video" | "none";

interface PiPTimerData {
    projectName?: string;
    taskName?: string;
    description?: string;
    logoUrl?: string;
    siteName?: string;
}

interface UsePiPTimerReturn {
    /** Whether PiP is currently active */
    isPiPActive: boolean;
    /** Which tier of PiP support is available */
    supportTier: PiPSupportTier;
    /** Whether any PiP is supported */
    isPiPSupported: boolean;
    /** Open the floating timer window */
    openPiP: (data: PiPTimerData, elapsedSeconds: number) => Promise<void>;
    /** Close the floating timer window */
    closePiP: () => void;
}

/**
 * Detects which PiP tier the current browser supports.
 */
function detectPiPSupport(): PiPSupportTier {
    if (typeof window === "undefined") return "none";

    // Tier 1: Document Picture-in-Picture
    if ("documentPictureInPicture" in window) {
        return "document";
    }

    // Tier 2: Standard Video PiP (with canvas support)
    if (
        document.pictureInPictureEnabled &&
        typeof HTMLCanvasElement.prototype.captureStream === "function"
    ) {
        return "video";
    }

    return "none";
}

/**
 * Custom hook that manages Picture-in-Picture timer functionality.
 * Supports two tiers:
 * - Tier 1 (Document PiP): Full HTML window (Chrome/Edge)
 * - Tier 2 (Video PiP): Canvas-rendered timer (Firefox/Safari)
 */
export function usePiPTimer(
    onStopTimer: () => void
): UsePiPTimerReturn {
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [supportTier, setSupportTier] = useState<PiPSupportTier>("none");

    // Refs for cleanup
    const pipWindowRef = useRef<Window | null>(null);
    const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const canvasCleanupRef = useRef<(() => void) | null>(null);
    const elapsedRef = useRef(0);

    // Detect support on mount
    useEffect(() => {
        setSupportTier(detectPiPSupport());
    }, []);

    const isPiPSupported = supportTier !== "none";

    /**
     * Clean up all PiP resources.
     */
    const cleanupPiP = useCallback(() => {
        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (canvasCleanupRef.current) {
            canvasCleanupRef.current();
            canvasCleanupRef.current = null;
        }
        if (pipWindowRef.current && !pipWindowRef.current.closed) {
            pipWindowRef.current.close();
        }
        pipWindowRef.current = null;

        // Exit standard PiP if active
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
        }

        setIsPiPActive(false);
    }, []);

    /**
     * Open Document PiP (Tier 1) — full HTML window.
     */
    const openDocumentPiP = useCallback(
        async (data: PiPTimerData, elapsedSeconds: number) => {
            if (!window.documentPictureInPicture) return;

            try {
                const pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 340,
                    height: 200,
                });

                pipWindowRef.current = pipWindow;
                elapsedRef.current = elapsedSeconds;

                const { updateTime } = buildPiPDocument(
                    pipWindow,
                    {
                        projectName: data.projectName,
                        taskName: data.taskName,
                        description: data.description,
                        logoUrl: data.logoUrl,
                        elapsedSeconds,
                    },
                    () => {
                        onStopTimer();
                        cleanupPiP();
                    }
                );

                // Update the time every second
                updateIntervalRef.current = setInterval(() => {
                    elapsedRef.current += 1;
                    updateTime(elapsedRef.current);
                }, 1000);

                // Listen for PiP window close
                pipWindow.addEventListener("pagehide", () => {
                    cleanupPiP();
                });

                setIsPiPActive(true);
            } catch (error) {
                console.error("Failed to open Document PiP:", error);
                cleanupPiP();
            }
        },
        [onStopTimer, cleanupPiP]
    );

    /**
     * Open Standard Video PiP (Tier 2) — canvas rendered.
     */
    const openVideoPiP = useCallback(
        async (data: PiPTimerData, elapsedSeconds: number) => {
            try {
                const { canvas, video, cleanup } = createCanvasPiPElements();
                canvasCleanupRef.current = cleanup;
                elapsedRef.current = elapsedSeconds;

                // Initial render
                renderTimerToCanvas(canvas, {
                    projectName: data.projectName,
                    taskName: data.taskName,
                    description: data.description,
                    elapsedSeconds,
                });

                // Start animation loop for canvas updates
                const animLoop = () => {
                    renderTimerToCanvas(canvas, {
                        projectName: data.projectName,
                        taskName: data.taskName,
                        description: data.description,
                        elapsedSeconds: elapsedRef.current,
                    });
                    animFrameRef.current = requestAnimationFrame(animLoop);
                };
                animFrameRef.current = requestAnimationFrame(animLoop);

                // Increment elapsed seconds
                updateIntervalRef.current = setInterval(() => {
                    elapsedRef.current += 1;
                }, 1000);

                // Wait for video to be ready, then request PiP
                await video.play();
                await video.requestPictureInPicture();

                // Set up Media Session for stop control
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: data.projectName || data.description || "Timer Running",
                        artist: data.siteName || "Aranora",
                        album: data.taskName || "Time Tracking",
                    });

                    navigator.mediaSession.setActionHandler("stop", () => {
                        onStopTimer();
                        cleanupPiP();
                    });

                    navigator.mediaSession.setActionHandler("pause", () => {
                        onStopTimer();
                        cleanupPiP();
                    });
                }

                // Listen for PiP exit
                video.addEventListener("leavepictureinpicture", () => {
                    cleanupPiP();
                });

                setIsPiPActive(true);
            } catch (error) {
                console.error("Failed to open Video PiP:", error);
                cleanupPiP();
            }
        },
        [onStopTimer, cleanupPiP]
    );

    /**
     * Open PiP using the best available tier.
     */
    const openPiP = useCallback(
        async (data: PiPTimerData, elapsedSeconds: number) => {
            // Close any existing PiP first
            cleanupPiP();

            const tier = detectPiPSupport();
            if (tier === "document") {
                await openDocumentPiP(data, elapsedSeconds);
            } else if (tier === "video") {
                await openVideoPiP(data, elapsedSeconds);
            }
        },
        [cleanupPiP, openDocumentPiP, openVideoPiP]
    );

    /**
     * Close PiP.
     */
    const closePiP = useCallback(() => {
        cleanupPiP();
    }, [cleanupPiP]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            cleanupPiP();
        };
    }, [cleanupPiP]);

    return {
        isPiPActive,
        supportTier,
        isPiPSupported,
        openPiP,
        closePiP,
    };
}
