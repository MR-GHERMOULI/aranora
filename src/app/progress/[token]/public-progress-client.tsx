"use client"

import { motion, Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Globe, ExternalLink, Briefcase, Activity,
    Shield, Layers, Target, Layout, Search
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useMemo } from "react"

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

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
    Planning: {
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50",
        icon: AlertCircle,
        label: "Planning",
    },
    "In Progress": {
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
        icon: Activity,
        label: "Execution",
    },
    "On Hold": {
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
        icon: AlertCircle,
        label: "On Hold",
    },
    Completed: {
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50",
        icon: CheckCircle2,
        label: "Completed",
    },
    Cancelled: {
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50",
        icon: AlertCircle,
        label: "Cancelled",
    },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
    "Done": { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500" },
    "In Progress": { icon: Activity, color: "text-blue-500", bg: "bg-blue-500" },
    "Todo": { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
    "Postponed": { icon: Clock, color: "text-orange-500", bg: "bg-orange-500" },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
    High: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50", label: "High" },
    Medium: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50", label: "Medium" },
    Low: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50", label: "Low" },
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
}

const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 120, damping: 18 }
    }
}

export default function PublicProgressClient({ data, platformLogoUrl, platformSiteName = "Aranora" }: { data: ProjectData | null, platformLogoUrl?: string | null, platformSiteName?: string }) {
    const [searchQuery, setSearchQuery] = useState("")

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 max-w-lg bg-card rounded-2xl border shadow-xl"
                >
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-3">Link Unavailable</h1>
                    <p className="text-muted-foreground mb-8">
                        The requested project progress page could not be found or the link has been deactivated.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Back to Home <ArrowUpRight className="h-4 w-4" />
                    </a>
                </motion.div>
            </div>
        )
    }

    const { project, tasks, stats, owner } = data
    const currentStatus = statusConfig[project.status] || statusConfig.Planning
    const StatusIcon = currentStatus.icon

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks
        return tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [tasks, searchQuery])

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary flex items-center justify-center overflow-hidden shrink-0">
                            {platformLogoUrl ? (
                                <img src={platformLogoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                                <Layout className="h-4 w-4 text-primary-foreground" />
                            )}
                        </div>
                        <span className="text-lg font-bold tracking-tight hidden sm:block">{platformSiteName}</span>
                    </a>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                            <Shield className="h-3.5 w-3.5" />
                            Secure Link
                        </div>
                        <div className="h-6 w-px bg-border hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-3 gap-8"
                >
                    {/* LEFT SIDE (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Project Header Card */}
                        <motion.section variants={itemVariants}>
                            <Card className="overflow-hidden relative bg-card/50 backdrop-blur border-border/50">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${currentStatus.color}`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {currentStatus.label}
                                            </Badge>
                                            
                                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                                {project.title}
                                            </h1>

                                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
                                                {project.start_date && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4" />
                                                        Started {formatDate(project.start_date)}
                                                    </div>
                                                )}
                                                {project.end_date && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Target className="h-4 w-4" />
                                                        Target {formatDate(project.end_date)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center">
                                            <div className="relative h-28 w-28 flex items-center justify-center">
                                                <svg className="h-full w-full transform -rotate-90">
                                                    <circle
                                                        cx="56"
                                                        cy="56"
                                                        r="50"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        className="text-muted"
                                                    />
                                                    <motion.circle
                                                        cx="56"
                                                        cy="56"
                                                        r="50"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        strokeDasharray={314.16}
                                                        initial={{ strokeDashoffset: 314.16 }}
                                                        animate={{ strokeDashoffset: 314.16 - (314.16 * stats.percentage) / 100 }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        fill="transparent"
                                                        strokeLinecap="round"
                                                        className="text-primary"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold">{stats.percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.section>

                        {/* 2. Key Metrics Dashboard */}
                        <motion.section variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Total Tasks", value: stats.total, icon: Layers, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
                                { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
                                { label: "In Progress", value: stats.inProgress, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
                                { label: "Remaining", value: stats.todo, icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-card/50">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <div className={`mb-2 p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.section>

                        {/* 3. Task List */}
                        <motion.section variants={itemVariants}>
                            <Card>
                                <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <ListTodo className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold tracking-tight">Project Tasks</h3>
                                            <p className="text-sm text-muted-foreground">{stats.completed} of {stats.total} completed</p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input 
                                            type="text" 
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 w-full sm:w-64 pl-9 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <CardContent className="p-0">
                                    {filteredTasks.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground">No tasks found.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            <TaskGroup title="In Progress" tasks={filteredTasks.filter(t => t.status === "In Progress")} />
                                            <TaskGroup title="To Do" tasks={filteredTasks.filter(t => t.status === "Todo" || t.status === "Postponed")} />
                                            <TaskGroup title="Completed" tasks={filteredTasks.filter(t => t.status === "Done")} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.section>
                    </div>

                    {/* RIGHT SIDE (1 col) */}
                    <aside className="space-y-6">
                        <motion.div variants={itemVariants} className="sticky top-24 space-y-6">
                            
                            {/* Executive Profile Card */}
                            <Card className="overflow-hidden">
                                <div className="h-20 bg-muted relative">
                                    <div className="absolute -bottom-8 left-6 h-16 w-16 p-1 bg-background rounded-xl shadow-sm border">
                                        {owner.logo_url ? (
                                            <img src={owner.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/10 rounded-lg flex items-center justify-center text-xl font-bold text-primary">
                                                {(owner.company || owner.name).charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <CardContent className="pt-12 pb-6 px-6">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground mb-3">
                                        <Briefcase className="h-3 w-3" />
                                        Project Lead
                                    </div>
                                    
                                    <h2 className="text-xl font-bold tracking-tight mb-1">
                                        {owner.company || owner.name}
                                    </h2>
                                    {owner.company && owner.name && owner.company !== owner.name && (
                                        <p className="text-sm text-muted-foreground">{owner.name}</p>
                                    )}

                                    {owner.bio && (
                                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                                            {owner.bio}
                                        </p>
                                    )}

                                    {owner.portfolio_url && (
                                        <div className="mt-6 pt-6 border-t">
                                            <a
                                                href={owner.portfolio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                                            >
                                                <Globe className="h-4 w-4" />
                                                Visit Website
                                                <ExternalLink className="h-3 w-3 opacity-50" />
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Powered By */}
                            <div className="flex flex-col items-center py-4 opacity-60 hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Powered by</span>
                                <a href="/" className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
                                        {platformLogoUrl ? (
                                            <img src={platformLogoUrl} alt="Logo" className="h-3.5 w-3.5 object-contain" />
                                        ) : (
                                            <Layout className="h-3 w-3 text-primary-foreground" />
                                        )}
                                    </div>
                                    <span className="font-bold text-sm tracking-tight">{platformSiteName}</span>
                                </a>
                            </div>

                        </motion.div>
                    </aside>
                </motion.div>
            </main>
        </div>
    )
}

function TaskGroup({ title, tasks }: { title: string, tasks: Task[] }) {
    if (tasks.length === 0) return null

    return (
        <div>
            <div className="bg-muted/50 px-4 sm:px-6 py-2.5 flex items-center gap-2 border-b">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 rounded-full border">{tasks.length}</span>
            </div>
            
            <div className="divide-y">
                {tasks.map((task) => {
                    const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                    const TaskIcon = statusCfg.icon
                    const isDone = task.status === "Done"
                    const pCfg = priorityConfig[task.priority]

                    return (
                        <div 
                            key={task.id}
                            className={`flex items-center gap-4 p-4 sm:px-6 transition-colors hover:bg-muted/30 ${isDone ? 'opacity-70' : ''}`}
                        >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                <TaskIcon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </p>
                            </div>

                            {task.priority && pCfg && !isDone && (
                                <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${pCfg.color} shrink-0`}>
                                    {pCfg.label}
                                </Badge>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
