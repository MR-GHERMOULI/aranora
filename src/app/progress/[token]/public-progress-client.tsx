"use client"

import { motion } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Mail, MapPin, Globe,
    ExternalLink, Briefcase, Sparkles, Activity,
    TrendingUp, BarChart3, Shield
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string; gradient: string }> = {
    Planning: {
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
        icon: AlertCircle,
        label: "Planning Phase",
        gradient: "from-amber-500 to-orange-400"
    },
    "In Progress": {
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
        icon: Clock,
        label: "In Progress",
        gradient: "from-blue-500 to-cyan-400"
    },
    "On Hold": {
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40",
        icon: AlertCircle,
        label: "On Hold",
        gradient: "from-orange-500 to-amber-400"
    },
    Completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
        icon: CheckCircle2,
        label: "Completed",
        gradient: "from-emerald-500 to-green-400"
    },
    Cancelled: {
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40",
        icon: AlertCircle,
        label: "Cancelled",
        gradient: "from-red-500 to-rose-400"
    },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
    "In Progress": { icon: Clock, color: "text-blue-500", bg: "bg-blue-500" },
    "Todo": { icon: Circle, color: "text-muted-foreground", bg: "bg-slate-400" },
    "Postponed": { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-400" },
}

const priorityConfig: Record<string, { color: string; dot: string }> = {
    High: { color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400", dot: "bg-red-500" },
    Medium: { color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-500" },
    Low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
}

export default function PublicProgressClient({ data }: { data: ProjectData | null }) {
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
                {/* Ambient background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-mesh" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-mesh" style={{ animationDelay: "5s" }} />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-5 p-10 max-w-sm relative"
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

    // Group tasks by status for organized display
    const doneTasks = tasks.filter(t => t.status === "Done")
    const inProgressTasks = tasks.filter(t => t.status === "In Progress")
    const pendingTasks = tasks.filter(t => t.status === "Todo" || t.status === "Postponed")

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative">

            {/* ══════ Animated gradient mesh background (same as landing page) ══════ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-primary/[0.04] rounded-full blur-3xl animate-mesh" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-secondary/[0.04] rounded-full blur-3xl animate-mesh" style={{ animationDelay: "5s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/[0.02] rounded-full blur-3xl animate-mesh" style={{ animationDelay: "10s" }} />
            </div>

            {/* ══════ Navigation ══════ */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <a href="https://www.aranora.com" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-brand-primary tracking-tight">Aranora</span>
                        </a>
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-semibold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                                Live Progress
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                                <Shield className="h-3 w-3" />
                                Verified
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ══════ Hero Section — Project Status Overview ══════ */}
            <section className="relative overflow-hidden border-b border-border">
                {/* Hero gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/[0.03] via-transparent to-brand-secondary/[0.03] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">

                        {/* Left: Project title & metadata */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 min-w-0"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-5">
                                <Sparkles className="h-3.5 w-3.5" />
                                Client Portal
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-4">
                                {project.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2.5 mb-5">
                                <Badge
                                    variant="outline"
                                    className={`${config.color} text-xs font-semibold px-3 py-1 border`}
                                >
                                    <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                    {config.label}
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

                            {/* Owner quick info in hero */}
                            <div className="flex items-center gap-3">
                                {owner.logo_url ? (
                                    <img
                                        src={owner.logo_url}
                                        alt={owner.company || owner.name}
                                        className="w-10 h-10 rounded-xl object-cover border-2 border-border shadow-sm"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-bold text-white">
                                            {(owner.company || owner.name).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{owner.company || owner.name}</p>
                                    <p className="text-xs text-muted-foreground">Project Manager</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Large progress ring */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="shrink-0"
                        >
                            <ProjectProgressBar
                                totalTasks={stats.total}
                                completedTasks={stats.completed}
                                inProgressTasks={stats.inProgress}
                                todoTasks={stats.todo}
                                variant="hero"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════ Main Content ══════ */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* ═══ LEFT COLUMN: Stats + Tasks ═══ */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Quick Stats Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                        >
                            {[
                                {
                                    label: "Total Tasks",
                                    value: stats.total,
                                    icon: ListTodo,
                                    color: "text-brand-primary",
                                    bg: "bg-brand-primary/10",
                                },
                                {
                                    label: "Completed",
                                    value: stats.completed,
                                    icon: CheckCircle2,
                                    color: "text-emerald-600 dark:text-emerald-400",
                                    bg: "bg-emerald-50 dark:bg-emerald-950/40",
                                },
                                {
                                    label: "In Progress",
                                    value: stats.inProgress,
                                    icon: Activity,
                                    color: "text-blue-600 dark:text-blue-400",
                                    bg: "bg-blue-50 dark:bg-blue-950/40",
                                },
                                {
                                    label: "Remaining",
                                    value: stats.todo,
                                    icon: Clock,
                                    color: "text-slate-500 dark:text-slate-400",
                                    bg: "bg-slate-50 dark:bg-slate-900/40",
                                },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                                    className="rounded-2xl border border-border bg-card p-4 card-brand-hover group"
                                >
                                    <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Task Breakdown */}
                        {tasks.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Card className="border border-border bg-card rounded-2xl shadow-none overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Section header */}
                                        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/15">
                                                    <ListTodo className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground tracking-tight">Task Breakdown</h3>
                                                    <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks complete</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground">{stats.percentage}%</span>
                                                <div className="h-2 w-16 rounded-full bg-muted/40 overflow-hidden hidden sm:block">
                                                    <motion.div
                                                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: `${stats.percentage}%` }}
                                                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task groups */}
                                        <div className="divide-y divide-border">
                                            {/* In Progress Tasks */}
                                            {inProgressTasks.length > 0 && (
                                                <TaskGroup
                                                    title="In Progress"
                                                    tasks={inProgressTasks}
                                                    dotColor="bg-blue-500"
                                                    baseDelay={0.5}
                                                />
                                            )}

                                            {/* Pending Tasks */}
                                            {pendingTasks.length > 0 && (
                                                <TaskGroup
                                                    title="To Do"
                                                    tasks={pendingTasks}
                                                    dotColor="bg-slate-400"
                                                    baseDelay={0.6}
                                                />
                                            )}

                                            {/* Completed Tasks */}
                                            {doneTasks.length > 0 && (
                                                <TaskGroup
                                                    title="Completed"
                                                    tasks={doneTasks}
                                                    dotColor="bg-emerald-500"
                                                    baseDelay={0.7}
                                                    isCompleted
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* ═══ RIGHT COLUMN: Owner Profile ═══ */}
                    <div className="lg:col-span-1 space-y-5">
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="rounded-2xl border border-border bg-card overflow-hidden sticky top-24 card-brand-hover"
                        >
                            {/* Branded top strip with grid pattern */}
                            <div className="h-28 bg-gradient-to-br from-brand-primary to-brand-primary-light relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" />
                                {/* Floating orbs — matches landing page hero mesh */}
                                <div className="absolute top-2 right-6 w-20 h-20 bg-white/10 rounded-full blur-xl animate-mesh" />
                                <div className="absolute -bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-mesh" style={{ animationDelay: "5s" }} />
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
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-widest mb-2.5">
                                    <Briefcase className="h-3 w-3" />
                                    Managed by
                                </div>

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
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground group/item">
                                            <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover/item:bg-brand-primary/10 transition-colors">
                                                <MapPin className="h-4 w-4 text-brand-primary" />
                                            </div>
                                            <span className="truncate">{owner.address}</span>
                                        </div>
                                    )}
                                    {owner.email && (
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground group/item">
                                            <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover/item:bg-brand-primary/10 transition-colors">
                                                <Mail className="h-4 w-4 text-brand-primary" />
                                            </div>
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

                        {/* Project Health Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="rounded-2xl border border-border bg-card p-5 card-brand-hover"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="h-9 w-9 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
                                    <TrendingUp className="h-4.5 w-4.5 text-brand-secondary-dark dark:text-brand-secondary" />
                                </div>
                                <h3 className="font-semibold text-foreground tracking-tight text-sm">Project Health</h3>
                            </div>
                            <div className="space-y-3">
                                <HealthMetric
                                    label="Overall Progress"
                                    value={stats.percentage}
                                    suffix="%"
                                />
                                <HealthMetric
                                    label="Completion Rate"
                                    value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                                    suffix="%"
                                />
                                <HealthMetric
                                    label="Active Tasks"
                                    value={stats.inProgress}
                                />
                            </div>
                        </motion.div>

                        {/* "Powered by" — subtle, below the card */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="text-center"
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

/* ═══════════ Task Group Component ═══════════ */
function TaskGroup({
    title,
    tasks,
    dotColor,
    baseDelay,
    isCompleted = false,
}: {
    title: string
    tasks: Task[]
    dotColor: string
    baseDelay: number
    isCompleted?: boolean
}) {
    return (
        <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
                <span className="text-xs text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="space-y-1.5">
                {tasks.map((task, i) => {
                    const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                    const TaskStatusIcon = statusCfg.icon
                    const isDone = task.status === "Done"
                    const pCfg = priorityConfig[task.priority]

                    return (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: baseDelay + i * 0.04 }}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group
                                ${isDone
                                    ? "opacity-50 hover:opacity-70"
                                    : "hover:bg-muted/40"
                                }`}
                        >
                            <TaskStatusIcon className={`h-4 w-4 shrink-0 ${statusCfg.color} ${isDone ? "fill-current" : ""}`} />
                            <span className={`text-sm flex-1 min-w-0 truncate ${isDone ? "line-through text-muted-foreground" : "font-medium text-foreground"}`}>
                                {task.title}
                            </span>
                            {task.priority && pCfg && (
                                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${pCfg.color} shrink-0`}>
                                    {task.priority}
                                </Badge>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

/* ═══════════ Health Metric Bar ═══════════ */
function HealthMetric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className="font-semibold text-foreground">{value}{suffix}</span>
            </div>
            {suffix === "%" && (
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light"
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(value, 100)}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    />
                </div>
            )}
        </div>
    )
}
