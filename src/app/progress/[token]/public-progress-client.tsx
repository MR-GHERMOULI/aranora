"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Calendar, CheckCircle2, Circle, Clock, AlertCircle,
    ArrowUpRight, ListTodo, Mail, MapPin, Globe, User,
    Quote, ExternalLink
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
    Planning: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
    "In Progress": { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
    "On Hold": { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
    Completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    Cancelled: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
}

const taskStatusIcons: Record<string, { icon: typeof Circle; color: string }> = {
    "Done": { icon: CheckCircle2, color: "text-emerald-500" },
    "In Progress": { icon: Clock, color: "text-blue-500" },
    "Todo": { icon: Circle, color: "text-muted-foreground" },
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
        <div className="min-h-screen bg-background relative selection:bg-brand-primary/30">
            {/* Premium SaaS Background Architecture */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* 1. Base Grid Pattern for that "technical/dev" SaaS feel */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
                
                {/* 2. Massive Vibrant Brand Orbs */}
                <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-primary/15 dark:bg-brand-primary/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-100 animate-pulse" />
                
                <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-600/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
                
                <div className="absolute bottom-[-10%] -right-[10%] w-[600px] h-[600px] bg-fuchsia-500/10 dark:bg-fuchsia-600/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
                
                {/* 3. Wash overlay to ensure text contrast isn't destroyed */}
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16">
                
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Project Details & Progress */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Project Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-card/60 backdrop-blur-xl border shadow-lg rounded-3xl p-6 sm:p-8"
                        >
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider mb-4">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-ping" />
                                Client Portal
                            </div>
                            
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-4">
                                {project.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge className={`${config.color} text-xs border-none shadow-sm px-3 py-1`} variant="secondary">
                                    <config.icon className="h-3.5 w-3.5 mr-1.5" />
                                    {project.status}
                                </Badge>
                                {project.start_date && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(project.start_date)}
                                        {project.end_date && ` — ${formatDate(project.end_date)}`}
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Progress Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
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
                                <Card className="border shadow-lg rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <ListTodo className="h-5 w-5 text-brand-primary" />
                                            <h3 className="font-semibold text-lg tracking-tight">Task Breakdown</h3>
                                            <span className="text-sm font-medium text-muted-foreground ml-auto bg-muted/50 px-3 py-1 rounded-full">
                                                {stats.completed}/{stats.total}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {tasks.map((task, i) => {
                                                const statusCfg = taskStatusIcons[task.status] || taskStatusIcons.Todo
                                                const StatusIcon = statusCfg.icon
                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${task.status === "Done" ? "bg-muted/30 opacity-70 border-muted" : "bg-background hover:border-brand-primary/30"
                                                            }`}
                                                    >
                                                        <StatusIcon className={`h-5 w-5 shrink-0 ${statusCfg.color} ${task.status === "Done" ? "fill-current" : ""}`} />
                                                        <span className={`text-base flex-1 min-w-0 truncate ${task.status === "Done" ? "line-through text-muted-foreground" : "font-medium"
                                                            }`}>
                                                            {task.title}
                                                        </span>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {task.priority && (
                                                                <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${priorityColors[task.priority] || ""}`}>
                                                                    {task.priority}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
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


                    {/* RIGHT COLUMN: Freelancer/Agency Profile Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 sticky top-8"
                        >
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-brand-primary/10 to-transparent rounded-t-3xl pointer-events-none" />
                            
                            <div className="flex flex-col items-center text-center relative z-10">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Managed By</h3>
                                
                                <div className="relative mb-4 group cursor-default">
                                    <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-brand-primary to-violet-500 rounded-full opacity-20 animate-spin-slow group-hover:opacity-40 transition-opacity" />
                                    {owner.logo_url ? (
                                        <img src={owner.logo_url} alt={owner.company || owner.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-background shadow-xl relative z-10 transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-background shadow-xl relative z-10 transition-transform group-hover:scale-105">
                                            <span className="text-3xl font-bold text-white">
                                                {(owner.company || owner.name).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
                                    {owner.company || owner.name}
                                </h2>
                                {owner.company && owner.name && owner.company !== owner.name && (
                                    <p className="text-sm font-medium text-muted-foreground mt-1">
                                        {owner.name}
                                    </p>
                                )}

                                {owner.address && (
                                    <span className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mt-4">
                                        <MapPin className="h-3.5 w-3.5 text-brand-primary/80" />
                                        {owner.address}
                                    </span>
                                )}

                                {owner.bio && (
                                    <div className="relative w-full mt-6 pt-6 border-t border-border/50">
                                        <Quote className="absolute top-4 left-0 h-4 w-4 text-brand-primary/20 rotate-180" />
                                        <p className="text-sm text-foreground/80 leading-relaxed italic px-6">
                                            {owner.bio}
                                        </p>
                                        <Quote className="absolute bottom-0 right-0 h-4 w-4 text-brand-primary/20" />
                                    </div>
                                )}

                                {owner.portfolio_url && (
                                    <div className="w-full mt-8">
                                        <a 
                                            href={owner.portfolio_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center w-full gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0 group"
                                        >
                                            <Globe className="h-4 w-4 group-hover:animate-pulse" />
                                            Explore Portfolio
                                            <ExternalLink className="h-3.5 w-3.5 opacity-60 ml-1" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-16 text-center"
                >
                    <a
                        href="https://www.aranora.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group px-4 py-2 rounded-full hover:bg-muted/50"
                    >
                        Powered by
                        <span className="font-semibold text-brand-primary group-hover:underline">
                            Aranora
                        </span>
                        <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                </motion.div>
            </div>
        </div>
    )
}

