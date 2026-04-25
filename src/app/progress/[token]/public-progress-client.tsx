"use client"

import { motion } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Mail, MapPin, Globe,
    ExternalLink, Briefcase, Sparkles, Activity,
    TrendingUp, Shield, Layers, Target, CheckSquare,
    Phone
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
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        icon: AlertCircle,
        label: "Planning",
        gradient: "from-amber-500 to-orange-400"
    },
    "In Progress": {
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        icon: Activity,
        label: "In Progress",
        gradient: "from-blue-500 to-cyan-400"
    },
    "On Hold": {
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
        icon: AlertCircle,
        label: "On Hold",
        gradient: "from-orange-500 to-amber-400"
    },
    Completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        icon: CheckCircle2,
        label: "Completed",
        gradient: "from-emerald-500 to-green-400"
    },
    Cancelled: {
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        icon: AlertCircle,
        label: "Cancelled",
        gradient: "from-red-500 to-rose-400"
    },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
    "In Progress": { icon: Activity, color: "text-blue-500", bg: "bg-blue-500" },
    "Todo": { icon: Circle, color: "text-slate-400 dark:text-slate-500", bg: "bg-slate-400" },
    "Postponed": { icon: Clock, color: "text-amber-500", bg: "bg-amber-500" },
}

const priorityConfig: Record<string, { color: string; dot: string }> = {
    High: { color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", dot: "bg-red-500" },
    Medium: { color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", dot: "bg-amber-500" },
    Low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dot: "bg-emerald-500" },
}

// Custom sophisticated layout variants for framer motion
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
}

export default function PublicProgressClient({ data }: { data: ProjectData | null }) {
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] animate-mesh" />
                    <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: "5s" }} />
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center space-y-6 p-10 max-w-md relative z-10 glass rounded-3xl border border-border/50 shadow-2xl shadow-brand-primary/5"
                >
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-10 w-10 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">Project Unavailable</h1>
                        <p className="text-muted-foreground text-base leading-relaxed">
                            This progress link is invalid, has expired, or sharing has been disabled by the project owner.
                        </p>
                    </div>
                    <div className="pt-4 border-t border-border/50">
                        <a
                            href="https://www.aranora.com"
                            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors shadow-lg shadow-foreground/10"
                        >
                            Visit Aranora <ArrowUpRight className="h-4 w-4" />
                        </a>
                    </div>
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

    const doneTasks = tasks.filter(t => t.status === "Done")
    const inProgressTasks = tasks.filter(t => t.status === "In Progress")
    const pendingTasks = tasks.filter(t => t.status === "Todo" || t.status === "Postponed")

    return (
        <div className="min-h-screen bg-background relative selection:bg-brand-primary/20">
            {/* ══════ Premium Ambient Background ══════ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
                <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-brand-primary/[0.03] dark:bg-brand-primary/[0.02] blur-[120px] animate-mesh" />
                <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-brand-secondary/[0.03] dark:bg-brand-secondary/[0.02] blur-[120px] animate-mesh" style={{ animationDelay: "7s" }} />
                
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* ══════ Header ══════ */}
            <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/40 supports-[backdrop-filter]:bg-background/40">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <motion.a 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            href="https://www.aranora.com" 
                            className="flex items-center gap-3 group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 group-hover:scale-105 transition-all duration-300">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-extrabold text-foreground tracking-tight">Aranora</span>
                        </motion.a>
                        
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-4"
                        >
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
                                <Shield className="h-3.5 w-3.5" />
                                Verified Project
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold tracking-wide uppercase">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                                </span>
                                Live Sync
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* ══════ Main Dashboard Content ══════ */}
            <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-12 gap-10"
                >
                    {/* ═══ LEFT COLUMN: Hero + Stats + Tasks (Spans 8 cols) ═══ */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* 1. Immersive Hero Section */}
                        <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-brand-primary/5 isolate">
                            {/* Decorative background elements inside hero */}
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/[0.05] via-transparent to-brand-secondary/[0.05] -z-10" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -z-10 transform translate-x-1/2 -translate-y-1/2" />
                            
                            <div className="p-8 sm:p-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex-1 min-w-0">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-foreground text-xs font-bold mb-6 shadow-sm">
                                            <Sparkles className="h-3.5 w-3.5 text-brand-secondary-dark dark:text-brand-secondary" />
                                            Client Portal
                                        </div>
                                        
                                        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.1] mb-6">
                                            {project.title}
                                        </h1>
                                        
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge variant="secondary" className={\`\${config.color} text-sm font-bold px-4 py-1.5 border shadow-sm\`}>
                                                <StatusIcon className="h-4 w-4 mr-2" />
                                                {config.label}
                                            </Badge>

                                            {project.start_date && (
                                                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border/50 px-4 py-1.5 rounded-full font-medium">
                                                    <Calendar className="h-4 w-4 text-foreground/70" />
                                                    {formatDate(project.start_date)}
                                                    {project.end_date && (
                                                        <span className="text-muted-foreground/60">→ {formatDate(project.end_date)}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Circular Progress Display in Hero */}
                                    <div className="shrink-0 flex justify-center md:justify-end">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-brand-secondary/20 blur-2xl rounded-full scale-110" />
                                            <ProjectProgressBar
                                                totalTasks={stats.total}
                                                completedTasks={stats.completed}
                                                inProgressTasks={stats.inProgress}
                                                todoTasks={stats.todo}
                                                variant="hero"
                                                className="border-none shadow-none bg-transparent p-0 relative z-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. Key Metrics Row */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Total Scope", value: stats.total, icon: Layers, gradient: "from-slate-500 to-slate-400" },
                                { label: "Completed", value: stats.completed, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-400" },
                                { label: "In Progress", value: stats.inProgress, icon: Activity, gradient: "from-blue-500 to-blue-400" },
                                { label: "To Do", value: stats.todo, icon: Target, gradient: "from-amber-500 to-amber-400" },
                            ].map((stat, i) => (
                                <div key={i} className="group relative p-6 rounded-3xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br \${stat.gradient} opacity-[0.03] dark:opacity-[0.05] rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-10 transition-all duration-500\`} />
                                    <div className="relative z-10">
                                        <div className="h-10 w-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <stat.icon className="h-5 w-5 text-foreground/70" />
                                        </div>
                                        <p className="text-3xl font-black text-foreground tracking-tight mb-1">{stat.value}</p>
                                        <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* 3. Task Breakdown Matrix */}
                        {tasks.length > 0 && (
                            <motion.div variants={itemVariants}>
                                <Card className="border-border/50 shadow-xl shadow-brand-primary/5 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
                                    <div className="px-8 py-6 border-b border-border/50 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                                <ListTodo className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground tracking-tight">Task Matrix</h3>
                                                <p className="text-sm text-muted-foreground mt-0.5">{stats.completed} out of {stats.total} delivered</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-2xl border border-border/50">
                                            <span className="text-sm font-bold text-foreground">{stats.percentage}%</span>
                                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-foreground"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: \`\${stats.percentage}%\` }}
                                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 sm:p-6 space-y-8">
                                        {inProgressTasks.length > 0 && (
                                            <TaskSection title="Actively Working" tasks={inProgressTasks} accent="blue" />
                                        )}
                                        {pendingTasks.length > 0 && (
                                            <TaskSection title="Upcoming Pipeline" tasks={pendingTasks} accent="slate" />
                                        )}
                                        {doneTasks.length > 0 && (
                                            <TaskSection title="Successfully Delivered" tasks={doneTasks} accent="emerald" isCompleted />
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* ═══ RIGHT COLUMN: Professional Profile (Spans 4 cols) ═══ */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div variants={itemVariants} className="sticky top-28 space-y-6">
                            
                            {/* Profile Card */}
                            <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-brand-primary/5">
                                {/* Elegant Header Graphic */}
                                <div className="h-32 bg-gradient-to-br from-foreground to-muted-foreground relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
                                </div>

                                <div className="px-8 pb-8 -mt-16 relative z-10">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-1.5 bg-card rounded-3xl shadow-xl mb-5">
                                            {owner.logo_url ? (
                                                <img
                                                    src={owner.logo_url}
                                                    alt={owner.company || owner.name}
                                                    className="w-24 h-24 rounded-2xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-3xl font-black text-white shadow-inner">
                                                    {(owner.company || owner.name).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-3">
                                            <Briefcase className="h-3 w-3" />
                                            Managed By
                                        </div>

                                        <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">
                                            {owner.company || owner.name}
                                        </h2>
                                        {owner.company && owner.name && owner.company !== owner.name && (
                                            <p className="text-base font-medium text-muted-foreground">{owner.name}</p>
                                        )}
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        {owner.email && (
                                            <a href={\`mailto:\${owner.email}\`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors group">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-white transition-all">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Email Contact</p>
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-brand-primary transition-colors">{owner.email}</p>
                                                </div>
                                            </a>
                                        )}
                                        
                                        {owner.address && (
                                            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors group">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-foreground group-hover:border-foreground group-hover:text-background transition-all">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
                                                    <p className="text-sm font-semibold text-foreground truncate">{owner.address}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {owner.bio && (
                                        <div className="mt-6 pt-6 border-t border-border/50">
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                {owner.bio}
                                            </p>
                                        </div>
                                    )}

                                    {owner.portfolio_url && (
                                        <div className="mt-8">
                                            <a
                                                href={owner.portfolio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center w-full gap-2 px-6 py-4 rounded-2xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold shadow-xl shadow-foreground/10 hover:shadow-foreground/20 hover:-translate-y-0.5 transition-all"
                                            >
                                                <Globe className="h-4 w-4" />
                                                View Professional Portfolio
                                                <ExternalLink className="h-3.5 w-3.5 opacity-70 ml-1" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Trust Badge / Powered By */}
                            <div className="flex flex-col items-center justify-center py-4 opacity-60 hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">Powered By</span>
                                <a href="https://www.aranora.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                                    <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                                        <svg className="h-3.5 w-3.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <span className="font-extrabold text-foreground tracking-tight group-hover:text-brand-primary transition-colors">Aranora</span>
                                </a>
                            </div>

                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}

/* ═══════════ Premium Task Section Component ═══════════ */
function TaskSection({
    title,
    tasks,
    accent,
    isCompleted = false,
}: {
    title: string
    tasks: Task[]
    accent: "blue" | "emerald" | "slate" | "amber"
    isCompleted?: boolean
}) {
    const accentConfig = {
        blue: "bg-blue-500",
        emerald: "bg-emerald-500",
        slate: "bg-slate-500 dark:bg-slate-400",
        amber: "bg-amber-500"
    }

    return (
        <div className="bg-card/40 rounded-2xl border border-border/40 p-2">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 mb-2">
                <span className={\`h-2.5 w-2.5 rounded-full \${accentConfig[accent]} shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:shadow-[0_0_8px_rgba(255,255,255,0.2)]\`} />
                <h4 className="text-sm font-bold text-foreground tracking-wide uppercase">{title}</h4>
                <Badge variant="secondary" className="ml-auto text-xs font-bold bg-muted/50 border-border/50">{tasks.length}</Badge>
            </div>
            
            <div className="space-y-1">
                {tasks.map((task, i) => {
                    const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                    const TaskStatusIcon = statusCfg.icon
                    const isDone = task.status === "Done"
                    const pCfg = priorityConfig[task.priority]

                    return (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className={\`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group hover:bg-muted/50 \${isDone ? "opacity-60" : ""}\`}
                        >
                            <div className={\`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 \${isDone ? "bg-emerald-500/10 border-emerald-500/20" : "bg-card border-border/50"}\`}>
                                <TaskStatusIcon className={\`h-4 w-4 \${statusCfg.color}\`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <p className={\`text-sm font-semibold truncate \${isDone ? "line-through text-muted-foreground" : "text-foreground"}\`}>
                                    {task.title}
                                </p>
                            </div>

                            {task.priority && pCfg && !isDone && (
                                <Badge variant="outline" className={\`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider \${pCfg.color} shrink-0\`}>
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
