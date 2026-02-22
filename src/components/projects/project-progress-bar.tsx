"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Circle, Clock, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectProgressBarProps {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    todoTasks: number
    variant?: "full" | "compact" | "hero"
    className?: string
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(0)
    const nodeRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const controls = animate(0, value, {
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => setDisplay(Math.round(v)),
        })
        return () => controls.stop()
    }, [value])

    return <span ref={nodeRef} className={className}>{display}</span>
}

function CircularProgress({ percentage, size = 120, strokeWidth = 8, variant = "full" }: {
    percentage: number
    size?: number
    strokeWidth?: number
    variant?: "full" | "compact" | "hero"
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI

    const actualSize = variant === "compact" ? 72 : variant === "hero" ? 160 : 120
    const actualStroke = variant === "compact" ? 6 : variant === "hero" ? 10 : 8
    const actualRadius = (actualSize - actualStroke) / 2
    const actualCircumference = actualRadius * 2 * Math.PI

    const getColor = (pct: number) => {
        if (pct >= 100) return { from: "#10b981", to: "#34d399", glow: "rgba(16,185,129,0.3)" }
        if (pct >= 75) return { from: "#3b82f6", to: "#60a5fa", glow: "rgba(59,130,246,0.3)" }
        if (pct >= 50) return { from: "#8b5cf6", to: "#a78bfa", glow: "rgba(139,92,246,0.3)" }
        if (pct >= 25) return { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.3)" }
        return { from: "#ef4444", to: "#f87171", glow: "rgba(239,68,68,0.3)" }
    }

    const colors = getColor(percentage)
    const gradientId = `progress-gradient-${Math.random().toString(36).slice(2)}`

    return (
        <div className="relative flex items-center justify-center" style={{ width: actualSize, height: actualSize }}>
            <svg width={actualSize} height={actualSize} className="-rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.from} />
                        <stop offset="100%" stopColor={colors.to} />
                    </linearGradient>
                </defs>
                {/* Background track */}
                <circle
                    cx={actualSize / 2}
                    cy={actualSize / 2}
                    r={actualRadius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/30 dark:text-muted/20"
                    strokeWidth={actualStroke}
                />
                {/* Animated progress arc */}
                <motion.circle
                    cx={actualSize / 2}
                    cy={actualSize / 2}
                    r={actualRadius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={actualStroke}
                    strokeLinecap="round"
                    strokeDasharray={actualCircumference}
                    initial={{ strokeDashoffset: actualCircumference }}
                    animate={{ strokeDashoffset: actualCircumference - (percentage / 100) * actualCircumference }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    style={{
                        filter: `drop-shadow(0 0 6px ${colors.glow})`,
                    }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={cn(
                    "font-bold tracking-tight",
                    variant === "compact" ? "text-lg" : variant === "hero" ? "text-4xl" : "text-2xl"
                )}>
                    <AnimatedNumber value={percentage} />
                    <span className={cn(
                        "text-muted-foreground font-normal",
                        variant === "compact" ? "text-xs" : variant === "hero" ? "text-lg" : "text-sm"
                    )}>%</span>
                </div>
                {variant !== "compact" && (
                    <span className={cn(
                        "text-muted-foreground font-medium",
                        variant === "hero" ? "text-sm" : "text-[10px]"
                    )}>
                        Complete
                    </span>
                )}
            </div>
        </div>
    )
}

function GradientProgressBar({ percentage, className }: { percentage: number; className?: string }) {
    const getGradient = (pct: number) => {
        if (pct >= 100) return "from-emerald-500 via-emerald-400 to-green-400"
        if (pct >= 75) return "from-blue-600 via-blue-500 to-cyan-400"
        if (pct >= 50) return "from-violet-600 via-purple-500 to-indigo-400"
        if (pct >= 25) return "from-amber-500 via-yellow-500 to-orange-400"
        return "from-red-500 via-rose-500 to-pink-400"
    }

    return (
        <div className={cn("relative w-full overflow-hidden rounded-full bg-muted/40 dark:bg-muted/20", className)}>
            <motion.div
                className={cn(
                    "h-full rounded-full bg-gradient-to-r relative",
                    getGradient(percentage)
                )}
                initial={{ width: "0%" }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
                    />
                </div>
                {/* Glow pulse */}
                {percentage > 0 && percentage < 100 && (
                    <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80"
                        animate={{
                            boxShadow: [
                                "0 0 4px 2px rgba(255,255,255,0.3)",
                                "0 0 8px 4px rgba(255,255,255,0.5)",
                                "0 0 4px 2px rgba(255,255,255,0.3)",
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </motion.div>
        </div>
    )
}

export function ProjectProgressBar({
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    variant = "full",
    className,
}: ProjectProgressBarProps) {
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    if (variant === "compact") {
        return (
            <div className={cn("space-y-2", className)}>
                <div className="flex items-center gap-3">
                    <CircularProgress percentage={percentage} variant="compact" />
                    <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs font-medium text-muted-foreground">Progress</span>
                            <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
                        </div>
                        <GradientProgressBar percentage={percentage} className="h-2" />
                    </div>
                </div>
            </div>
        )
    }

    const statCards = [
        {
            label: "Completed",
            count: completedTasks,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            border: "border-emerald-200/50 dark:border-emerald-800/40",
        },
        {
            label: "In Progress",
            count: inProgressTasks,
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            border: "border-blue-200/50 dark:border-blue-800/40",
        },
        {
            label: "To Do",
            count: todoTasks,
            icon: variant === "hero" ? ListTodo : Circle,
            color: "text-slate-500 dark:text-slate-400",
            bg: "bg-slate-50 dark:bg-slate-900/40",
            border: "border-slate-200/50 dark:border-slate-700/40",
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "rounded-2xl border bg-gradient-to-br from-card via-card to-muted/20 p-5 space-y-4",
                variant === "hero" && "p-8 space-y-6",
                className
            )}
        >
            {/* Top section: Ring + Bar */}
            <div className={cn(
                "flex items-center gap-5",
                variant === "hero" && "flex-col sm:flex-row gap-8"
            )}>
                <CircularProgress percentage={percentage} variant={variant} />
                <div className="flex-1 w-full space-y-3">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <h4 className={cn(
                                "font-semibold",
                                variant === "hero" ? "text-lg" : "text-sm"
                            )}>Project Progress</h4>
                            <p className={cn(
                                "text-muted-foreground",
                                variant === "hero" ? "text-sm" : "text-xs"
                            )}>
                                {completedTasks} of {totalTasks} tasks completed
                            </p>
                        </div>
                        {percentage >= 100 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 1 }}
                            >
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    All Done!
                                </span>
                            </motion.div>
                        )}
                    </div>
                    <GradientProgressBar
                        percentage={percentage}
                        className={variant === "hero" ? "h-4" : "h-3"}
                    />
                </div>
            </div>

            {/* Stat cards */}
            <div className={cn(
                "grid gap-3",
                variant === "hero" ? "grid-cols-3" : "grid-cols-3"
            )}>
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                        className={cn(
                            "flex items-center gap-2.5 rounded-xl border p-3 transition-colors",
                            stat.bg, stat.border,
                            variant === "hero" && "p-4"
                        )}
                    >
                        <stat.icon className={cn(
                            "shrink-0",
                            stat.color,
                            variant === "hero" ? "h-5 w-5" : "h-4 w-4"
                        )} />
                        <div className="min-w-0">
                            <p className={cn(
                                "font-bold leading-none",
                                variant === "hero" ? "text-xl" : "text-lg"
                            )}>{stat.count}</p>
                            <p className={cn(
                                "text-muted-foreground truncate",
                                variant === "hero" ? "text-xs mt-0.5" : "text-[10px]"
                            )}>{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

export function MiniProgressBar({ percentage, className }: { percentage: number; className?: string }) {
    const getGradient = (pct: number) => {
        if (pct >= 100) return "from-emerald-500 to-green-400"
        if (pct >= 75) return "from-blue-500 to-cyan-400"
        if (pct >= 50) return "from-violet-500 to-indigo-400"
        if (pct >= 25) return "from-amber-500 to-orange-400"
        return "from-red-500 to-pink-400"
    }

    return (
        <div className={cn("relative w-full overflow-hidden rounded-full bg-muted/30 dark:bg-muted/20 h-1.5", className)}>
            <motion.div
                className={cn("h-full rounded-full bg-gradient-to-r", getGradient(percentage))}
                initial={{ width: "0%" }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
        </div>
    )
}
