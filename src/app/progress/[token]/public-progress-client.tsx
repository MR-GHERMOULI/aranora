"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo
} from "lucide-react"

interface Task {
    id: string
    title: string
    status: string
    priority: string
}

interface ProjectData {
    project: {
        title: string
        status: string
        start_date?: string | null
        end_date?: string | null
    }
    tasks: Task[]
    stats: {
        total: number
        completed: number
        inProgress: number
        todo: number
        percentage: number
    }
    owner: {
        name: string
        company: string | null
    }
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
    Planning: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
    "In Progress": { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
    "On Hold": { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
    Completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    Cancelled: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500" },
    "In Progress": { icon: Clock, color: "text-blue-500" },
    "Todo": { icon: Circle, color: "text-slate-400" },
    "Postponed": { icon: AlertCircle, color: "text-orange-400" },
}

const priorityColors: Record<string, string> = {
    High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export default function PublicProgressClient({ data }: { data: ProjectData | null }) {
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
                <div className="text-center space-y-4 p-8">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Project Not Found</h1>
                    <p className="text-muted-foreground max-w-sm">
                        This progress link may have expired or sharing has been disabled by the project owner.
                    </p>
                </div>
            </div>
        )
    }

    const { project, tasks, stats, owner } = data
    const config = statusConfig[project.status] || statusConfig.Planning

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
            </div>

            <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border text-xs text-muted-foreground mb-4"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                        Live Progress
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                        {project.title}
                    </h1>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Badge className={`${config.color} text-xs`} variant="secondary">
                            {project.status}
                        </Badge>
                        {project.start_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(project.start_date)}
                                {project.end_date && ` — ${formatDate(project.end_date)}`}
                            </span>
                        )}
                    </div>
                    {owner.name && (
                        <p className="text-sm text-muted-foreground mt-3">
                            by <span className="font-medium text-foreground">{owner.company || owner.name}</span>
                        </p>
                    )}
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <ProjectProgressBar
                        totalTasks={stats.total}
                        completedTasks={stats.completed}
                        inProgressTasks={stats.inProgress}
                        todoTasks={stats.todo}
                        variant="hero"
                    />
                </motion.div>

                {/* Task List */}
                {tasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-black/20">
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Task Breakdown</h3>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {stats.completed}/{stats.total}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {tasks.map((task, i) => {
                                        const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                                        const StatusIcon = statusCfg.icon
                                        return (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${task.status === "Done" ? "bg-muted/30 opacity-70" : "bg-card hover:bg-muted/30"
                                                    }`}
                                            >
                                                <StatusIcon className={`h-4 w-4 shrink-0 ${statusCfg.color} ${task.status === "Done" ? "fill-current" : ""}`} />
                                                <span className={`text-sm flex-1 min-w-0 truncate ${task.status === "Done" ? "line-through text-muted-foreground" : "font-medium"
                                                    }`}>
                                                    {task.title}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {task.priority && (
                                                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority] || ""}`}>
                                                            {task.priority}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <a
                        href="https://www.aranora.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        Powered by
                        <span className="font-semibold text-brand-primary group-hover:underline">
                            Aranora
                        </span>
                        <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                </motion.div>
            </div>
        </div>
    )
}
