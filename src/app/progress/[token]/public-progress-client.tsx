"use client"

import { motion, AnimatePresence, Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Globe, ExternalLink, Briefcase, Activity,
    Shield, Layers, Target, Layout, Search, ChevronRight,
    TrendingUp, Zap, Share2
} from "lucide-react"
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

const statusConfig: Record<string, { gradient: string; icon: any; label: string; lightColor: string }> = {
    Planning: {
        gradient: "from-amber-500 to-orange-600",
        lightColor: "text-amber-500 bg-amber-500/10",
        icon: AlertCircle,
        label: "Strategic Planning",
    },
    "In Progress": {
        gradient: "from-blue-500 to-indigo-600",
        lightColor: "text-blue-500 bg-blue-500/10",
        icon: Activity,
        label: "Active Execution",
    },
    "On Hold": {
        gradient: "from-slate-500 to-slate-700",
        lightColor: "text-slate-500 bg-slate-500/10",
        icon: Clock,
        label: "Paused",
    },
    Completed: {
        gradient: "from-emerald-500 to-teal-600",
        lightColor: "text-emerald-500 bg-emerald-500/10",
        icon: CheckCircle2,
        label: "Delivered",
    },
    Cancelled: {
        gradient: "from-rose-500 to-red-600",
        lightColor: "text-rose-500 bg-rose-500/10",
        icon: AlertCircle,
        label: "Terminated",
    },
}

const taskStatusIcons: Record<string, { icon: any; color: string; bg: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
    "In Progress": { icon: Zap, color: "text-blue-500", bg: "bg-blue-500" },
    "Todo": { icon: Circle, color: "text-slate-400", bg: "bg-slate-400" },
    "Postponed": { icon: Clock, color: "text-amber-500", bg: "bg-amber-500" },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
    High: { color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50", label: "High Priority" },
    Medium: { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50", label: "Medium" },
    Low: { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50", label: "Standard" },
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
}

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
}

export default function PublicProgressClient({ data, platformLogoUrl, platformSiteName = "Aranora" }: { data: ProjectData | null, platformLogoUrl?: string | null, platformSiteName?: string }) {
    const [searchQuery, setSearchQuery] = useState("")

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,95,0.05),transparent_50%)]" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 text-center p-12 max-w-lg glass rounded-3xl border shadow-2xl"
                >
                    <div className="h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                        <AlertCircle className="h-10 w-10 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Access Restricted</h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        This project progress link is either inactive or doesn't exist. Please contact the project owner for a valid link.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        Return to Platform <ArrowUpRight className="h-5 w-5" />
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
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-foreground font-sans selection:bg-primary/20 selection:text-primary relative">
            {/* Direct Image-Inspired Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Main Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] via-[#1e3a5f] to-[#0f172a] opacity-90" />
                
                {/* Grid Pattern Overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.15]" 
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Subtle Radial Highlights */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(30,58,95,0.2),transparent_50%)]" />
            </div>

            {/* Header Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-white/10 dark:border-white/5 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-4 group">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                            {platformLogoUrl ? (
                                <img src={platformLogoUrl} alt="Aranora" className="h-full w-full object-contain p-1.5" />
                            ) : (
                                <Layout className="h-5 w-5 text-primary-foreground" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight leading-none">{platformSiteName}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Client Portal</span>
                        </div>
                    </a>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full glass border-white/20 text-xs font-bold text-emerald-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE TRACKING ACTIVE
                        </div>
                        <div className="h-8 w-px bg-border/50 hidden sm:block" />
                        <button className="h-10 w-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Page Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-12 gap-8"
                >
                    {/* LEFT COLUMN: Main Info & Tasks */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. Project Hero Section */}
                        <motion.section variants={itemVariants}>
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 dark:border-white/5 shadow-2xl shadow-black/5 bg-card">
                                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${currentStatus.gradient}`} />
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Target className="h-48 w-48 -rotate-12" />
                                </div>
                                
                                <div className="relative p-8 md:p-12">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-6 flex-1">
                                            <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border-none shadow-sm bg-gradient-to-r ${currentStatus.gradient} text-white`}>
                                                <StatusIcon className="h-3.5 w-3.5 mr-2" />
                                                {currentStatus.label}
                                            </Badge>
                                            
                                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                                                {project.title}
                                            </h1>

                                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-semibold">
                                                {project.start_date && (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 rounded-lg glass">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase tracking-wider opacity-60">Initiated</span>
                                                            <span className="text-sm">{formatDate(project.start_date)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {project.end_date && (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 rounded-lg glass">
                                                            <Target className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase tracking-wider opacity-60">Deadline</span>
                                                            <span className="text-sm">{formatDate(project.end_date)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center">
                                            <div className="relative h-40 w-40 flex items-center justify-center">
                                                {/* Sophisticated Progress Ring */}
                                                <svg className="h-full w-full transform -rotate-90">
                                                    <circle
                                                        cx="80"
                                                        cy="80"
                                                        r="72"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                        className="text-muted/20"
                                                    />
                                                    <motion.circle
                                                        cx="80"
                                                        cy="80"
                                                        r="72"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        strokeDasharray={452}
                                                        initial={{ strokeDashoffset: 452 }}
                                                        animate={{ strokeDashoffset: 452 - (452 * stats.percentage) / 100 }}
                                                        transition={{ duration: 2, ease: "circOut" }}
                                                        fill="transparent"
                                                        strokeLinecap="round"
                                                        className="text-primary drop-shadow-[0_0_8px_rgba(30,58,95,0.4)]"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.span 
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-4xl font-black tracking-tighter"
                                                    >
                                                        {stats.percentage}%
                                                    </motion.span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. Intelligence Bar */}
                        <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Tasks", value: stats.total, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                { label: "In Progress", value: stats.inProgress, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
                                { label: "Waiting", value: stats.todo, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                            ].map((stat, i) => (
                                <div key={i} className="glass p-5 rounded-2xl border-white/10 flex flex-col items-start gap-4 group hover:bg-white/5 transition-all">
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.section>

                        {/* 3. Task Management Section */}
                        <motion.section variants={itemVariants}>
                            <div className="glass rounded-[2rem] border-white/10 overflow-hidden shadow-xl">
                                <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                            <ListTodo className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight">Milestone Roadmap</h3>
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                {stats.completed} of {stats.total} operational goals met
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Filter objectives..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-12 w-full md:w-72 pl-12 pr-6 rounded-2xl glass border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-2">
                                    {filteredTasks.length === 0 ? (
                                        <div className="text-center py-24">
                                            <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                                                <Search className="h-8 w-8 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-xl font-bold text-muted-foreground">No matching milestones found</p>
                                            <p className="text-sm text-muted-foreground/60 mt-2">Try adjusting your search filters</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <TaskGroup title="Current Focus" tasks={filteredTasks.filter(t => t.status === "In Progress")} type="active" />
                                            <TaskGroup title="Upcoming Milestones" tasks={filteredTasks.filter(t => t.status === "Todo" || t.status === "Postponed")} type="pending" />
                                            <TaskGroup title="Completed Assets" tasks={filteredTasks.filter(t => t.status === "Done")} type="done" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* RIGHT COLUMN: Profile & Metadata */}
                    <aside className="lg:col-span-4 space-y-8">
                        <motion.div variants={itemVariants} className="sticky top-28 space-y-8">
                            
                            {/* 4. Professional Partner Card */}
                            <div className="glass rounded-[2rem] border-white/10 overflow-hidden shadow-2xl relative group bg-card">
                                <div className="h-32 bg-gradient-to-br from-primary to-indigo-900 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                                    <div className="absolute -bottom-12 -right-12 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                                </div>
                                
                                <div className="px-8 pb-8">
                                    <div className="relative -mt-12 mb-6">
                                        <div className="h-24 w-24 p-1.5 glass rounded-[1.75rem] shadow-2xl border-white/20">
                                            {owner.logo_url ? (
                                                <img src={owner.logo_url} alt="Partner Logo" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-black text-white rounded-2xl">
                                                    {(owner.company || owner.name).charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Badge variant="outline" className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20 mb-3">
                                                Project Director
                                            </Badge>
                                            <h2 className="text-3xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                                                {owner.company || owner.name}
                                            </h2>
                                            {owner.company && owner.name && owner.company !== owner.name && (
                                                <p className="text-base font-semibold text-muted-foreground/80 mt-1">{owner.name}</p>
                                            )}
                                        </div>

                                        {owner.bio && (
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                {owner.bio}
                                            </p>
                                        )}

                                        <div className="pt-6 space-y-3">
                                            {owner.portfolio_url && (
                                                <a
                                                    href={owner.portfolio_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between w-full p-4 rounded-2xl glass border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group/link"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/link:bg-primary/10 group-hover/link:text-primary transition-all">
                                                            <Globe className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-sm font-bold">Official Website</span>
                                                    </div>
                                                    <ExternalLink className="h-4 w-4 opacity-30 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all" />
                                                </a>
                                            )}
                                            
                                            {owner.email && (
                                                <div className="p-4 rounded-2xl glass border-white/10 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">Communication</span>
                                                        <span className="text-sm font-bold truncate max-w-[180px]">{owner.email}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Trust & Security Badge */}
                            <div className="glass p-6 rounded-[2rem] border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified Dashboard</h4>
                                        <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">
                                            This link is cryptographically secured. Project data is pulled directly from the {platformSiteName} ecosystem in real-time.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Branding Footer */}
                            <div className="flex flex-col items-center gap-6 py-8">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
                                <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-all duration-500">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Infrastructure by</span>
                                    <a href="/" className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all">
                                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                                            {platformLogoUrl ? (
                                                <img src={platformLogoUrl} alt="Logo" className="h-5 w-5 object-contain" />
                                            ) : (
                                                <Layout className="h-4 w-4 text-primary-foreground" />
                                            )}
                                        </div>
                                        <span className="font-black text-lg tracking-tighter">{platformSiteName}</span>
                                    </a>
                                </div>
                            </div>

                        </motion.div>
                    </aside>
                </motion.div>
            </main>
        </div>
    )
}

function TaskGroup({ title, tasks, type }: { title: string, tasks: Task[], type: 'active' | 'pending' | 'done' }) {
    if (tasks.length === 0) return null

    const typeConfig = {
        active: { color: "text-blue-500", bg: "bg-blue-500/10", icon: Zap },
        pending: { color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
        done: { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    }

    const cfg = typeConfig[type]
    const Icon = cfg.icon

    return (
        <div className="p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className={`p-2 rounded-lg ${cfg.bg} ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-muted-foreground/80">{title}</h3>
                <span className="text-[10px] font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-auto">
                    {tasks.length}
                </span>
            </div>
            
            <div className="grid gap-2">
                <AnimatePresence mode="popLayout">
                    {tasks.map((task) => {
                        const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                        const TaskIcon = statusCfg.icon
                        const isDone = task.status === "Done"
                        const pCfg = priorityConfig[task.priority]

                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                key={task.id}
                                className={`flex items-center gap-4 p-5 rounded-2xl glass border-white/5 hover:border-white/20 transition-all group ${isDone ? 'opacity-60 grayscale-[0.5]' : 'shadow-sm bg-card'}`}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}`}>
                                    <TaskIcon className="h-5 w-5" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className={`text-base font-bold truncate transition-all ${isDone ? 'line-through text-muted-foreground/50' : 'group-hover:text-primary'}`}>
                                            {task.title}
                                        </p>
                                        {task.priority && pCfg && !isDone && (
                                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${pCfg.color} border shadow-none shrink-0 hidden sm:inline-flex`}>
                                                {pCfg.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                        <span className={statusCfg.color}>{task.status}</span>
                                        {task.priority && <span className="opacity-30">•</span>}
                                        {task.priority && <span>{task.priority} Priority</span>}
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
