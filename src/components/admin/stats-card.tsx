"use client"

import { cn } from "@/lib/utils"
import {
    Users,
    Briefcase,
    FileText,
    DollarSign,
    Mail,
    MailOpen,
    Radio,
    TrendingUp,
    Activity,
    BarChart
} from "lucide-react"

// Map of icon names to components - add more as needed
const iconMap = {
    Users,
    Briefcase,
    FileText,
    DollarSign,
    Mail,
    MailOpen,
    Radio,
    TrendingUp,
    Activity,
    BarChart,
} as const

type IconName = keyof typeof iconMap

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    iconName: IconName
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatsCard({
    title,
    value,
    description,
    iconName,
    trend,
    className,
}: StatsCardProps) {
    const Icon = iconMap[iconName]
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
                className
            )}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>

                {(description || trend) && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend && (
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                    trend.isPositive
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                        {description && (
                            <span className="text-xs text-muted-foreground">
                                {description}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
