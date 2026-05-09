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
import { motion } from "framer-motion"

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
    delay?: number
}

export function StatsCard({
    title,
    value,
    description,
    iconName,
    trend,
    className,
    delay = 0,
}: StatsCardProps) {
    const Icon = iconMap[iconName]
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -5 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10",
                className
            )}
        >
            {/* Background Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                            {title}
                        </p>
                        <p className="text-3xl font-black tracking-tight text-foreground">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-inner group-hover:from-primary group-hover:to-secondary transition-all duration-500">
                        <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                    </div>
                </div>

                {(description || trend) && (
                    <div className="mt-6 flex items-center gap-3">
                        {trend && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                                    trend.isPositive
                                        ? "bg-green-500/10 text-green-600 ring-green-500/20 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                        {description && (
                            <span className="text-xs font-medium text-muted-foreground/70">
                                {description}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
