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

const statusConfig: Record<string, { gradient: string; icon: any; label: string; glow: string }> = {
    Planning: {
        gradient: "from-amber-400 to-orange-500",
        glow: "shadow-amber-500/20",
        icon: AlertCircle,
        label: "Strategic Planning",
    },
    "In Progress": {
        gradient: "from-blue-400 to-indigo-500",
        glow: "shadow-blue-500/20",
        icon: Activity,
        label: "Active Execution",
    },
    "On Hold": {
        gradient: "from-slate-400 to-slate-600",
        glow: "shadow-slate-500/20",
        icon: Clock,
        label: "Paused",
    },
    Completed: {
        gradient: "from-emerald-400 to-teal-500",
        glow: "shadow-emerald-500/20",
        icon: CheckCircle2,
        label: "Delivered",
    },
    Cancelled: {
        gradient: "from-rose-400 to-red-500",
        glow: "shadow-rose-500/20",
        icon: AlertCircle,
        label: "Terminated",
    },
}

const taskStatusIcons: Record<string, { icon: any; color: string; glow: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-400", glow: "shadow-emerald-500/10" },
    "In Progress": { icon: Zap, color: "text-blue-400", glow: "shadow-blue-500/10" },
    "Todo": { icon: Circle, color: "text-slate-400", glow: "" },
    "Postponed": { icon: Clock, color: "text-amber-400", glow: "shadow-amber-500/10" },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
    High: { color: "bg-rose-500/20 text-rose-300 border-rose-500/30", label: "High Priority" },
    Medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Medium" },
    Low: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Standard" },
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
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/20 to-transparent z-0" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center p-12 max-w-lg glass rounded-[3rem] border border-white/10 shadow-2xl"
                >
                    <div className="h-24 w-24 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                        <AlertCircle className="h-12 w-12 text-rose-400" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">Link Inactive</h1>
                    <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                        The requested project dashboard is currently unavailable or the access token has expired.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-[#10b981] text-white font-black hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
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
        <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-[#10b981]/30 selection:text-[#10b981] relative">
            {/* Visual Identity Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] via-[#1e3a5f] to-[#0f172a] opacity-80" />
                <div 
                    className="absolute inset-0 opacity-[0.12]" 
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: '48px 48px'
                    }}
                />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_60%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(30,58,95,0.3),transparent_60%)]" />
            </div>

            {/* Premium Sticky Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-3xl shadow-2xl">
                <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-5 group">
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-2xl group-hover:rotate-6 transition-all duration-500 p-2">
                            {platformLogoUrl ? (
                                <img src={platformLogoUrl} alt="Aranora" className="h-full w-full object-contain" />
                            ) : (
                                <Layout className="h-6 w-6 text-[#1e3a5f]" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter leading-none text-white">{platformSiteName}</span>
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#10b981] mt-1">Operational Portal</span>
                        </div>
                    </a>
                    
                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-black text-emerald-400 tracking-widest uppercase">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                            Synchronized Live
                        </div>
                        <div className="h-10 w-px bg-white/10 hidden sm:block" />
                        <button className="h-12 w-12 rounded-2xl glass flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/10 shadow-lg">
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-8 py-16 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-12 gap-10"
                >
                    {/* LEFT COLUMN: Hero & Roadmap */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* 1. Impactful Project Hero */}
                        <motion.section variants={itemVariants}>
                            <div className="relative overflow-hidden rounded-[3.5rem] border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
                                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${currentStatus.gradient}`} />
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                                    <Target className="h-64 w-64" />
                                </div>
                                
                                <div className="relative p-10 md:p-16">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                                        <div className="space-y-8 flex-1">
                                            <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${currentStatus.gradient} text-white shadow-lg ${currentStatus.glow}`}>
                                                <StatusIcon className="h-4 w-4" />
                                                {currentStatus.label}
                                            </div>
                                            
                                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1] text-white">
                                                {project.title}
                                            </h1>

                                            <div className="flex flex-wrap items-center gap-10 text-slate-300 font-black uppercase tracking-widest text-[11px]">
                                                {project.start_date && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#10b981] border border-white/10">
                                                            <Calendar className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="opacity-50">Initiation</span>
                                                            <span className="text-white text-sm tracking-normal mt-0.5">{formatDate(project.start_date)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {project.end_date && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/10">
                                                            <Target className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="opacity-50">Target Delivery</span>
                                                            <span className="text-white text-sm tracking-normal mt-0.5">{formatDate(project.end_date)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center">
                                            <div className="relative h-48 w-48 flex items-center justify-center">
                                                <svg className="h-full w-full transform -rotate-90">
                                                    <circle
                                                        cx="96"
                                                        cy="96"
                                                        r="84"
                                                        stroke="rgba(255,255,255,0.05)"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                    />
                                                    <motion.circle
                                                        cx="96"
                                                        cy="96"
                                                        r="84"
                                                        stroke="#10b981"
                                                        strokeWidth="12"
                                                        strokeDasharray={528}
                                                        initial={{ strokeDashoffset: 528 }}
                                                        animate={{ strokeDashoffset: 528 - (528 * stats.percentage) / 100 }}
                                                        transition={{ duration: 2.5, ease: "circOut" }}
                                                        fill="transparent"
                                                        strokeLinecap="round"
                                                        className="drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.span 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-5xl font-black tracking-tighter text-white"
                                                    >
                                                        {stats.percentage}%
                                                    </motion.span>
                                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#10b981] mt-2">Success</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. Unified Metric Suite */}
                        <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "Operational Goals", value: stats.total, icon: Layers, color: "text-blue-400", bg: "bg-blue-400/10" },
                                { label: "Executed Assets", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                                { label: "In Active Flow", value: stats.inProgress, icon: Zap, color: "text-[#10b981]", bg: "bg-emerald-400/10" },
                                { label: "Pending Review", value: stats.todo, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
                            ].map((stat, i) => (
                                <div key={i} className="glass p-7 rounded-[2.5rem] border-white/5 flex flex-col items-start gap-6 group hover:bg-white/10 transition-all duration-500 hover:-translate-y-1">
                                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-xl`}>
                                        <stat.icon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <div className="text-4xl font-black tracking-tighter text-white">{stat.value}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 leading-tight">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.section>

                        {/* 3. Milestone Grid */}
                        <motion.section variants={itemVariants}>
                            <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
                                <div className="p-10 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-10 bg-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-[2rem] bg-[#10b981] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                                            <ListTodo className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tight text-white">Milestone Matrix</h3>
                                            <p className="text-sm font-black text-[#10b981] flex items-center gap-3 uppercase tracking-widest mt-1">
                                                <TrendingUp className="h-4 w-4" />
                                                Performance tracking enabled
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative group min-w-[320px]">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-[#10b981] transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Search specific goals..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-16 w-full pl-16 pr-8 rounded-[1.5rem] glass border-white/10 text-base font-black focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 transition-all placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-4">
                                    {filteredTasks.length === 0 ? (
                                        <div className="text-center py-32">
                                            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5">
                                                <Search className="h-10 w-10 text-slate-700" />
                                            </div>
                                            <p className="text-2xl font-black text-slate-500">No matching objectives identified</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <TaskGroup title="Current Active Priorities" tasks={filteredTasks.filter(t => t.status === "In Progress")} type="active" />
                                            <TaskGroup title="Strategic Backlog" tasks={filteredTasks.filter(t => t.status === "Todo" || t.status === "Postponed")} type="pending" />
                                            <TaskGroup title="Validated Milestones" tasks={filteredTasks.filter(t => t.status === "Done")} type="done" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* RIGHT COLUMN: Business Identity */}
                    <aside className="lg:col-span-4 space-y-10">
                        <motion.div variants={itemVariants} className="sticky top-32 space-y-10">
                            
                            {/* 4. Executive Partner Card */}
                            <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl relative group hover:scale-[1.02] transition-all duration-700">
                                <div className="h-40 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#10b981]/10 to-transparent" />
                                </div>
                                
                                <div className="px-10 pb-12">
                                    <div className="relative -mt-20 mb-10">
                                        <div className="h-32 w-32 p-2 glass rounded-[2.5rem] shadow-2xl border-white/10 group-hover:rotate-3 transition-transform duration-700">
                                            {owner.logo_url ? (
                                                <img src={owner.logo_url} alt="Logo" className="w-full h-full object-cover rounded-[2rem]" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#10b981] to-[#1e3a5f] flex items-center justify-center text-4xl font-black text-white rounded-[2rem]">
                                                    {(owner.company || owner.name).charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <Badge variant="outline" className="px-5 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.4em] bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 mb-5">
                                                Project Lead
                                            </Badge>
                                            <h2 className="text-4xl font-black tracking-tighter text-white leading-none">
                                                {owner.company || owner.name}
                                            </h2>
                                            {owner.company && owner.name && owner.company !== owner.name && (
                                                <p className="text-lg font-bold text-slate-400 mt-2">{owner.name}</p>
                                            )}
                                        </div>

                                        {owner.bio && (
                                            <p className="text-base text-slate-300 leading-relaxed font-bold">
                                                {owner.bio}
                                            </p>
                                        )}

                                        <div className="pt-8 space-y-4">
                                            {owner.portfolio_url && (
                                                <a
                                                    href={owner.portfolio_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between w-full p-6 rounded-[2rem] glass border-white/10 hover:border-[#10b981]/50 hover:bg-[#10b981]/5 transition-all group/link"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover/link:bg-[#10b981]/20 group-hover/link:text-[#10b981] transition-all border border-white/5">
                                                            <Globe className="h-6 w-6" />
                                                        </div>
                                                        <span className="text-base font-black text-white">Digital Headquarters</span>
                                                    </div>
                                                    <ExternalLink className="h-5 w-5 text-[#10b981] opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Trust Signature */}
                            <div className="glass p-8 rounded-[3.5rem] border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                                    <Shield className="h-32 w-32" />
                                </div>
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                                        <Shield className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">Verified Governance</h4>
                                        <p className="text-xs font-bold text-slate-400 leading-relaxed">
                                            Data integrity is maintained through encrypted platform synchronization. Link validity is monitored in real-time.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Branding Footer */}
                            <div className="flex flex-col items-center gap-10 py-10">
                                <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-all duration-700">
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 mb-6">Secured by</span>
                                    <a href="/" className="flex items-center gap-5 grayscale hover:grayscale-0 transition-all duration-500">
                                        <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-2xl p-1.5">
                                            {platformLogoUrl ? (
                                                <img src={platformLogoUrl} alt="Logo" className="h-full w-full object-contain" />
                                            ) : (
                                                <Layout className="h-5 w-5 text-[#1e3a5f]" />
                                            )}
                                        </div>
                                        <span className="font-black text-2xl tracking-tighter text-white">{platformSiteName}</span>
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
        active: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Zap },
        pending: { color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
        done: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
    }

    const cfg = typeConfig[type]
    const Icon = cfg.icon

    return (
        <div className="p-6">
            <div className="flex items-center gap-5 mb-8 px-4">
                <div className={`p-3 rounded-2xl ${cfg.bg} ${cfg.color} shadow-lg border border-white/5`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">{title}</h3>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[11px] font-black bg-white/5 border border-white/10 px-4 py-1 rounded-full">
                    {tasks.length} Assets
                </span>
            </div>
            
            <div className="grid gap-4">
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
                                className={`flex items-center gap-6 p-8 rounded-[2.5rem] glass border-white/5 hover:border-white/10 transition-all group ${isDone ? 'opacity-50 hover:opacity-80 transition-opacity' : 'shadow-2xl shadow-black/20 hover:bg-white/10'}`}
                            >
                                <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-6 ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 group-hover:text-[#10b981] group-hover:bg-[#10b981]/10 border border-white/5'}`}>
                                    <TaskIcon className={`h-7 w-7 ${statusCfg.glow}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-5 mb-2">
                                        <p className={`text-xl font-black truncate transition-all ${isDone ? 'line-through text-slate-600' : 'text-white group-hover:text-[#10b981]'}`}>
                                            {task.title}
                                        </p>
                                        {task.priority && pCfg && !isDone && (
                                            <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 ${pCfg.color} border shadow-none shrink-0 hidden sm:inline-flex rounded-full`}>
                                                {pCfg.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <span className={`${statusCfg.color} flex items-center gap-2`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                            {task.status}
                                        </span>
                                        {task.priority && <span className="opacity-30">•</span>}
                                        {task.priority && <span>{task.priority} Priority</span>}
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                    <ChevronRight className="h-7 w-7 text-white/20" />
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
