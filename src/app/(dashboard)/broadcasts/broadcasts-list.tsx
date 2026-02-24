"use client"

import { useState } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { format } from "date-fns"
import { Radio, Info, AlertCircle, CheckCircle, Bell } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type Notification = {
    id: string
    created_at: string
    title: string | null
    message: string
    type: string
    read: boolean
}

interface BroadcastsListProps {
    notifications: Notification[] | null
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

export function BroadcastsList({ notifications }: BroadcastsListProps) {
    const [filter, setFilter] = useState<"all" | "unread">("all")

    const filteredNotifications = notifications?.filter(n => {
        if (filter === "unread") return !n.read
        return true
    }) || []

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "info": return <Info className="h-5 w-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            case "success": return <CheckCircle className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            case "warning": return <AlertCircle className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            default: return <Bell className="h-5 w-5 text-brand-primary drop-shadow-[0_0_8px_rgba(var(--brand-primary),0.5)]" />
        }
    }

    const getTypeGradients = (type: string) => {
        switch (type) {
            case "info": return "from-blue-500/10 to-transparent border-blue-500/20"
            case "success": return "from-emerald-500/10 to-transparent border-emerald-500/20"
            case "warning": return "from-amber-500/10 to-transparent border-amber-500/20"
            default: return "from-brand-primary/10 to-transparent border-brand-primary/20"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-card/50 backdrop-blur-xl border border-border/50 p-2 rounded-2xl shadow-sm">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full sm:w-auto">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-transparent h-auto p-1">
                        <TabsTrigger
                            value="all"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-300"
                        >
                            All Broadcasts
                            <Badge variant="secondary" className="ml-2 bg-muted/50">{notifications?.length || 0}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="unread"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-300"
                        >
                            Unread
                            <Badge variant={filter === "unread" ? "default" : "secondary"} className="ml-2">
                                {notifications?.filter(n => !n.read).length || 0}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <AnimatePresence mode="popLayout">
                {filteredNotifications.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {filteredNotifications.map((n) => (
                            <motion.div
                                key={n.id}
                                variants={itemVariants}
                                layout
                                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${getTypeGradients(n.type)} bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                            >
                                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-current to-transparent opacity-20" />
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 bg-background/50 border shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                                                <h3 className="font-semibold text-lg tracking-tight group-hover:text-foreground/90 transition-colors">
                                                    {n.title || "Platform Announcement"}
                                                </h3>
                                                <span className="text-sm font-medium text-muted-foreground/70 bg-background/50 px-3 py-1 rounded-full border">
                                                    {format(new Date(n.created_at), 'PPP')}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-[15px]">
                                                {n.message}
                                            </p>
                                            {!n.read && (
                                                <div className="pt-3">
                                                    <Badge className="bg-brand-primary text-brand-primary-foreground animate-pulse shadow-[0_0_10px_rgba(var(--brand-primary),0.3)]">
                                                        New
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="text-center py-24 bg-card/30 backdrop-blur-md rounded-3xl border border-dashed border-border/60 shadow-inner relative overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-border/50">
                                <Radio className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight">No broadcasts found</h3>
                            <p className="text-muted-foreground max-w-md mx-auto text-lg">
                                {filter === "unread"
                                    ? "You've read all your notifications. You're completely caught up!"
                                    : "When the platform sends out announcements and updates, they will appear right here."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
