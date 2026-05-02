"use client"

import { motion, Variants } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Mail, MapPin, Globe,
    ExternalLink, Briefcase, Sparkles, Activity,
    TrendingUp, Shield, Layers, Target, CheckSquare,
    Info, Layout, Search, Filter
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

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string; theme: string }> = {
    Planning: {
        color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        icon: AlertCircle,
        label: "Planning",
        theme: "amber"
    },
    "In Progress": {
        color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        icon: Activity,
        label: "Execution",
        theme: "blue"
    },
    "On Hold": {
        color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
        icon: AlertCircle,
        label: "On Hold",
        theme: "orange"
    },
    Completed: {
        color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        icon: CheckCircle2,
        label: "Completed",
        theme: "emerald"
    },
    Cancelled: {
        color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        icon: AlertCircle,
        label: "Cancelled",
        theme: "red"
    },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
    "In Progress": { icon: Activity, color: "text-blue-500", bg: "bg-blue-500" },
    "Todo": { icon: Circle, color: "text-slate-400 dark:text-slate-500", bg: "bg-slate-400" },
    "Postponed": { icon: Clock, color: "text-amber-500", bg: "bg-amber-500" },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
    High: { color: "bg-red-500/10 text-red-600 border-red-200", label: "High" },
    Medium: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Medium" },
    Low: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Low" },
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
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 max-w-lg bg-white dark:bg-[#1E293B] rounded-[2rem] border border-border/60 shadow-2xl"
                >
                    <div className="h-20 w-20 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#1E293B] dark:text-white tracking-tight mb-4">Link Unavailable</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                        The requested project progress page could not be found or the link has been deactivated.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#1E3A5F] text-white font-bold hover:bg-[#152945] transition-all shadow-lg"
                    >
                        Back to Home <ArrowUpRight className="h-5 w-5" />
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-slate-200 font-sans selection:bg-[#1E3A5F]/10">
            {/* ══════ Premium Top Navigation ══════ */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#1E3A5F] flex items-center justify-center shadow-lg border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shrink-0">
                            {platformLogoUrl ? (
                                <img src={platformLogoUrl} alt="Logo" className="h-full w-full object-contain p-1.5" />
                            ) : (
                                <div className="w-full h-full bg-[#1E3A5F] flex items-center justify-center">
                                    <Layout className="h-6 w-6 text-white" />
                                </div>
                            )}
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#1E3A5F] dark:text-white hidden sm:block">{platformSiteName}</span>
                    </a>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <Shield className="h-3.5 w-3.5" />
                            Secure Link
                        </div>
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Status</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ══════ Main Content Area ══════ */}
            <main className="max-w-7xl mx-auto px-6 py-10 lg:py-16">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-12 gap-8 lg:gap-12"
                >
                    {/* ═══ LEFT SIDE: Summary & Timeline (8 cols) ═══ */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. Project Header Card */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-8 sm:p-12 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E3A5F]/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
                            
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                    <div className="space-y-4 max-w-2xl">
                                        <Badge className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold border ${currentStatus.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                            {currentStatus.label}
                                        </Badge>
                                        
                                        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1E3A5F] dark:text-white leading-[1.1] tracking-tight">
                                            {project.title}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 pt-2">
                                            {project.start_date && (
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <Calendar className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
                                                    Started {formatDate(project.start_date)}
                                                </div>
                                            )}
                                            {project.end_date && (
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <Target className="h-4 w-4 text-emerald-500" />
                                                    Target {formatDate(project.end_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <div className="relative h-32 w-32 flex items-center justify-center">
                                            <svg className="h-full w-full transform -rotate-90">
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="58"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    fill="transparent"
                                                    className="text-slate-100 dark:text-slate-800"
                                                />
                                                <motion.circle
                                                    cx="64"
                                                    cy="64"
                                                    r="58"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeDasharray={364.42}
                                                    initial={{ strokeDashoffset: 364.42 }}
                                                    animate={{ strokeDashoffset: 364.42 - (364.42 * stats.percentage) / 100 }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    fill="transparent"
                                                    className="text-[#1E3A5F] dark:text-emerald-500"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-[#1E3A5F] dark:text-white">{stats.percentage}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. Key Metrics Dashboard */}
                        <motion.section variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Deliverables", value: stats.total, icon: Layers, color: "text-blue-500" },
                                { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
                                { label: "Active", value: stats.inProgress, icon: Activity, color: "text-[#1E3A5F] dark:text-blue-400" },
                                { label: "Upcoming", value: stats.todo, icon: Clock, color: "text-amber-500" },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`h-10 w-10 rounded-xl mb-4 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className="text-3xl font-bold text-[#1E3A5F] dark:text-white mb-1">{stat.value}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </motion.section>

                        {/* 3. Task Matrix Log */}
                        <motion.section variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                            <div className="px-8 py-8 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#1E3A5F] flex items-center justify-center shadow-lg shadow-blue-900/10">
                                            <ListTodo className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E3A5F] dark:text-white tracking-tight">Project Timeline</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stats.completed} of {stats.total} items successfully completed</p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#1E3A5F] transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-11 w-full sm:w-64 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-10">
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Search className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching deliverables found</p>
                                    </div>
                                ) : (
                                    <>
                                        <TaskGroup 
                                            title="Work in Progress" 
                                            tasks={filteredTasks.filter(t => t.status === "In Progress")} 
                                            type="active" 
                                        />
                                        <TaskGroup 
                                            title="Pipeline & Queue" 
                                            tasks={filteredTasks.filter(t => t.status === "Todo" || t.status === "Postponed")} 
                                            type="pending" 
                                        />
                                        <TaskGroup 
                                            title="Delivered & Verified" 
                                            tasks={filteredTasks.filter(t => t.status === "Done")} 
                                            type="completed" 
                                        />
                                    </>
                                )}
                            </div>
                        </motion.section>
                    </div>

                    {/* ═══ RIGHT SIDE: Professional Identity (4 cols) ═══ */}
                    <aside className="lg:col-span-4 space-y-6">
                        <motion.div variants={itemVariants} className="sticky top-28 space-y-6">
                            
                            {/* Executive Profile Card */}
                            <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                                {/* Header Decorative Stripe */}
                                <div className="h-24 bg-[#1E3A5F] relative">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-20 p-1.5 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl">
                                        {owner.logo_url ? (
                                            <img src={owner.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-black text-[#1E3A5F] dark:text-white">
                                                {(owner.company || owner.name).charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-14 pb-10 px-8 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                                        <Briefcase className="h-3 w-3" />
                                        Project Lead
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold text-[#1E3A5F] dark:text-white tracking-tight mb-2">
                                        {owner.company || owner.name}
                                    </h2>
                                    {owner.company && owner.name && owner.company !== owner.name && (
                                        <p className="text-sm font-semibold text-slate-400">{owner.name}</p>
                                    )}

                                    {owner.bio && (
                                        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-6">
                                            {owner.bio}
                                        </p>
                                    )}

                                    <div className="mt-10">
                                        {owner.portfolio_url && (
                                            <a
                                                href={owner.portfolio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#1E3A5F] text-white hover:bg-[#152945] transition-all shadow-lg shadow-blue-900/10"
                                            >
                                                <Globe className="h-4 w-4" />
                                                <span className="text-sm font-bold">Visit Portfolio</span>
                                                <ExternalLink className="h-3 w-3 opacity-60" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Verification Badge */}
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Authentic Project</h4>
                                    <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-500/60 mt-1">This progress report is cryptographically verified and synced directly from the project workspace.</p>
                                </div>
                            </div>

                            {/* Powered By Footer */}
                            <div className="flex flex-col items-center py-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700 mb-3">Enterprise Infrastructure</span>
                                <a href="/" className="flex items-center gap-2 group grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
                                    <div className="h-6 w-6 rounded-md bg-[#1E3A5F] flex items-center justify-center">
                                        {platformLogoUrl ? (
                                            <img src={platformLogoUrl} alt="Logo" className="h-4 w-4 object-contain" />
                                        ) : (
                                            <Layout className="h-3.5 w-3.5 text-white" />
                                        )}
                                    </div>
                                    <span className="font-bold text-[#1E3A5F] dark:text-white tracking-tight">{platformSiteName}</span>
                                </a>
                            </div>

                        </motion.div>
                    </aside>
                </motion.div>
            </main>
        </div>
    )
}

/* ═══════════ Elegant Task Group Component ═══════════ */
function TaskGroup({ title, tasks, type }: { title: string, tasks: Task[], type: "active" | "pending" | "completed" }) {
    if (tasks.length === 0) return null

    const typeConfig = {
        active: { color: "bg-blue-500", text: "text-blue-500" },
        pending: { color: "bg-amber-500", text: "text-amber-500" },
        completed: { color: "bg-emerald-500", text: "text-emerald-500" }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${typeConfig[type].color}`} />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{title}</h3>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800/60">{tasks.length}</span>
            </div>
            
            <div className="grid gap-3">
                {tasks.map((task) => {
                    const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                    const TaskIcon = statusCfg.icon
                    const isDone = task.status === "Done"
                    const pCfg = priorityConfig[task.priority]

                    return (
                        <div 
                            key={task.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 transition-all ${isDone ? 'bg-slate-50/50 dark:bg-slate-900/10' : 'bg-white dark:bg-[#1E293B]'}`}
                        >
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                <TaskIcon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isDone ? 'text-slate-400 line-through' : 'text-[#1E3A5F] dark:text-slate-200'}`}>
                                    {task.title}
                                </p>
                            </div>

                            {task.priority && pCfg && !isDone && (
                                <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${pCfg.color} shrink-0`}>
                                    {pCfg.label}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
