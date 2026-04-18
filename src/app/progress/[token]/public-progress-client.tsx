"use client"

import { motion } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Mail, MapPin, Globe,
    ExternalLink, Briefcase, Sparkles
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
        logo_url: string | null
        email: string | null
        address: string | null
        bio: string | null
        portfolio_url: string | null
    }
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
    Planning: { color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40", icon: AlertCircle },
    "In Progress": { color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40", icon: Clock },
    "On Hold": { color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40", icon: AlertCircle },
    Completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40", icon: CheckCircle2 },
    Cancelled: { color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40", icon: AlertCircle },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500" },
    "In Progress": { icon: Clock, color: "text-blue-500" },
    "Todo": { icon: Circle, color: "text-muted-foreground" },
    "Postponed": { icon: AlertCircle, color: "text-orange-400" },
}

const priorityColors: Record<string, string> = {
    High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
    Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
}

export default function PublicProgressClient({ data }: { data: ProjectData | null }) {
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-5 p-10 max-w-sm"
                >
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center mx-auto shadow-lg shadow-brand-primary/20">
                        <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Project Not Found</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        This progress link may have expired or sharing has been disabled by the project owner.
                    </p>
                    <a
                        href="https://www.aranora.com"
                        className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline font-medium"
                    >
                        Go to Aranora <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                </motion.div>
            </div>
        )
    }

    const { project, tasks, stats, owner } = data
    const config = statusConfig[project.status] || statusConfig.Planning
    const StatusIcon = config.icon

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative">

            {/* Subtle ambient background — matches landing page style */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl" />
            </div>

            {/* Top header bar — same as landing page nav feel */}
            <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-md shadow-brand-primary/20">
                            <Briefcase className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-foreground tracking-tight">Aranora</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-semibold uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                        Live Progress
                    </div>
                </div>
            </header>

            <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* ═══ LEFT COLUMN: Project Info + Progress + Tasks ═══ */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Project Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-2xl border border-border bg-card p-6 sm:p-8 card-brand-hover"
                        >
                            {/* Section label */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-5">
                                <Sparkles className="h-3.5 w-3.5" />
                                Client Portal
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug mb-4">
                                {project.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2.5">
                                <Badge
                                    variant="outline"
                                    className={`${config.color} text-xs font-semibold px-3 py-1 border`}
                                >
                                    <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                    {project.status}
                                </Badge>

                                {project.start_date && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border px-3 py-1 rounded-full">
                                        <Calendar className="h-3.5 w-3.5 text-brand-primary" />
                                        {formatDate(project.start_date)}
                                        {project.end_date && (
                                            <> &mdash; {formatDate(project.end_date)}</>
                                        )}
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Progress Bar Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                        >
                            <ProjectProgressBar
                                totalTasks={stats.total}
                                completedTasks={stats.completed}
                                inProgressTasks={stats.inProgress}
                                todoTasks={stats.todo}
                                variant="hero"
                            />
                        </motion.div>

                        {/* Task Breakdown */}
                        {tasks.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card className="border border-border bg-card rounded-2xl shadow-none">
                                    <CardContent className="p-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-2.5 mb-6">
                                            <div className="h-9 w-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                                <ListTodo className="h-4.5 w-4.5 text-brand-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground tracking-tight">Task Breakdown</h3>
                                                <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks complete</p>
                                            </div>
                                            <span className="ml-auto text-sm font-semibold text-muted-foreground bg-muted/60 border border-border px-3 py-1 rounded-full">
                                                {stats.completed}/{stats.total}
                                            </span>
                                        </div>

                                        {/* Task rows */}
                                        <div className="space-y-2">
                                            {tasks.map((task, i) => {
                                                const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                                                const StatusIcon = statusCfg.icon
                                                const isDone = task.status === "Done"
                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
                                                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all group
                                                            ${isDone
                                                                ? "bg-muted/30 border-border/50 opacity-60"
                                                                : "bg-background border-border hover:border-brand-primary/30 hover:shadow-sm"
                                                            }`}
                                                    >
                                                        <StatusIcon className={`h-4.5 w-4.5 shrink-0 ${statusCfg.color} ${isDone ? "fill-current opacity-70" : ""}`} />
                                                        <span className={`text-sm flex-1 min-w-0 truncate ${isDone ? "line-through text-muted-foreground" : "font-medium text-foreground"}`}>
                                                            {task.title}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {task.priority && (
                                                                <Badge variant="outline" className={`text-[11px] px-2 py-0.5 border ${priorityColors[task.priority] || ""}`}>
                                                                    {task.priority}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-[11px] px-2 py-0.5 text-muted-foreground border-border">
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
                    </div>

                    {/* ═══ RIGHT COLUMN: Owner Profile ═══ */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="rounded-2xl border border-border bg-card overflow-hidden sticky top-8 card-brand-hover"
                        >
                            {/* Branded top strip */}
                            <div className="h-24 bg-gradient-to-br from-brand-primary to-brand-primary-light relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" />
                            </div>

                            <div className="px-6 pb-6 -mt-10 relative">
                                {/* Avatar */}
                                <div className="mb-4">
                                    {owner.logo_url ? (
                                        <img
                                            src={owner.logo_url}
                                            alt={owner.company || owner.name}
                                            className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center border-4 border-card shadow-lg">
                                            <span className="text-2xl font-bold text-white">
                                                {(owner.company || owner.name).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                    Managed by
                                </p>

                                {/* Name / Company */}
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    {owner.company || owner.name}
                                </h2>
                                {owner.company && owner.name && owner.company !== owner.name && (
                                    <p className="text-sm text-muted-foreground mt-0.5">{owner.name}</p>
                                )}

                                {/* Contact info */}
                                <div className="mt-4 space-y-2.5">
                                    {owner.address && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 text-brand-primary shrink-0" />
                                            <span className="truncate">{owner.address}</span>
                                        </div>
                                    )}
                                    {owner.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4 text-brand-primary shrink-0" />
                                            <a href={`mailto:${owner.email}`} className="truncate hover:text-brand-primary transition-colors">
                                                {owner.email}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                {owner.bio && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {owner.bio}
                                        </p>
                                    </div>
                                )}

                                {/* Portfolio CTA */}
                                {owner.portfolio_url && (
                                    <div className="mt-5">
                                        <a
                                            href={owner.portfolio_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-semibold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-[0.99] transition-all"
                                        >
                                            <Globe className="h-4 w-4" />
                                            View Portfolio
                                            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* "Powered by" — subtle, below the card */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="mt-4 text-center"
                        >
                            <a
                                href="https://www.aranora.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                Powered by
                                <span className="font-semibold text-brand-primary group-hover:underline">Aranora</span>
                                <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </a>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    )
}
