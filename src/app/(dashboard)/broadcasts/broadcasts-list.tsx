"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { format, isToday, isThisWeek, isThisMonth } from "date-fns"
import {
    Radio, Info, AlertCircle, CheckCircle, Bell,
    Search, Megaphone, X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { markBroadcastsAsRead } from "@/components/layout/notifications/actions"
import { useEffect } from "react"

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

type FilterType = "all" | "unread" | "broadcast_info" | "broadcast_success" | "broadcast_warning"

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } }
}

function getTypeLabel(type: string) {
    switch (type) {
        case "broadcast_info": return "Info"
        case "broadcast_success": return "Update"
        case "broadcast_warning": return "Warning"
        default: return "Broadcast"
    }
}

function getTypeIcon(type: string, size = "h-5 w-5") {
    switch (type) {
        case "broadcast_info": return <Info className={`${size} text-blue-500`} />
        case "broadcast_success": return <CheckCircle className={`${size} text-emerald-500`} />
        case "broadcast_warning": return <AlertCircle className={`${size} text-amber-500`} />
        default: return <Bell className={`${size} text-brand-primary`} />
    }
}

function getTypeBadgeClass(type: string) {
    switch (type) {
        case "broadcast_info": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        case "broadcast_success": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        case "broadcast_warning": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        default: return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
    }
}

function getTypeAccentClass(type: string) {
    switch (type) {
        case "broadcast_info": return "border-l-blue-500"
        case "broadcast_success": return "border-l-emerald-500"
        case "broadcast_warning": return "border-l-amber-500"
        default: return "border-l-brand-primary"
    }
}

function getDateGroup(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isThisWeek(date, { weekStartsOn: 1 })) return "This Week"
    if (isThisMonth(date)) return "This Month"
    return "Older"
}

const DATE_GROUP_ORDER = ["Today", "This Week", "This Month", "Older"]

export function BroadcastsList({ notifications }: BroadcastsListProps) {
    const [filter, setFilter] = useState<FilterType>("all")
    const [search, setSearch] = useState("")
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

    useEffect(() => {
        const unreadCount = notifications?.filter(n => !n.read).length || 0
        if (unreadCount > 0) {
            markBroadcastsAsRead()
        }
    }, [notifications])

    const stats = useMemo(() => ({
        total: notifications?.length || 0,
        unread: notifications?.filter(n => !n.read).length || 0,
        info: notifications?.filter(n => n.type === "broadcast_info").length || 0,
        warning: notifications?.filter(n => n.type === "broadcast_warning").length || 0,
    }), [notifications])

    const filtered = useMemo(() => {
        return (notifications || []).filter(n => {
            const matchesFilter =
                filter === "all" ||
                (filter === "unread" && !n.read) ||
                n.type === filter
            const matchesSearch = !search ||
                (n.title?.toLowerCase().includes(search.toLowerCase())) ||
                n.message.toLowerCase().includes(search.toLowerCase())
            return matchesFilter && matchesSearch
        })
    }, [notifications, filter, search])

    const grouped = useMemo(() => {
        const groups: Record<string, Notification[]> = {}
        for (const n of filtered) {
            const group = getDateGroup(n.created_at)
            if (!groups[group]) groups[group] = []
            groups[group].push(n)
        }
        return DATE_GROUP_ORDER.filter(g => groups[g]?.length > 0).map(g => ({
            label: g,
            items: groups[g],
        }))
    }, [filtered])

    const FILTERS: { value: FilterType; label: string }[] = [
        { value: "all", label: "All" },
        { value: "unread", label: "Unread" },
        { value: "broadcast_info", label: "Info" },
        { value: "broadcast_success", label: "Updates" },
        { value: "broadcast_warning", label: "Warnings" },
    ]

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Broadcasts
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Platform announcements and system updates.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-brand-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Megaphone className="h-5 w-5 text-brand-primary opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Unread</p>
                                <p className="text-2xl font-bold">{stats.unread}</p>
                            </div>
                            <Bell className="h-5 w-5 text-rose-500 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Info</p>
                                <p className="text-2xl font-bold">{stats.info}</p>
                            </div>
                            <Info className="h-5 w-5 text-blue-500 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Warnings</p>
                                <p className="text-2xl font-bold">{stats.warning}</p>
                            </div>
                            <AlertCircle className="h-5 w-5 text-amber-500 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search broadcasts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 flex-wrap">
                    {FILTERS.map(f => (
                        <Button
                            key={f.value}
                            variant={filter === f.value ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                            {f.value === "unread" && stats.unread > 0 && (
                                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] h-4">
                                    {stats.unread}
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Messages grouped by date */}
            <AnimatePresence mode="popLayout">
                {grouped.length > 0 ? (
                    <div className="space-y-8">
                        {grouped.map(({ label, items }) => (
                            <div key={label} className="space-y-3">
                                {/* Date Section Header */}
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {label}
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground">{items.length}</span>
                                </div>

                                {/* Items */}
                                <motion.div
                                    key={label + filter + search}
                                    initial="hidden"
                                    animate="show"
                                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                                    className="space-y-2"
                                >
                                    {items.map(n => (
                                        <motion.div
                                            key={n.id}
                                            variants={itemVariants}
                                            layout
                                        >
                                            <Card
                                                className={`group border-l-4 ${getTypeAccentClass(n.type)} hover:shadow-md transition-all duration-200 hover:border-l-[5px] cursor-pointer`}
                                                onClick={() => setSelectedNotification(n)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        {/* Icon */}
                                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted/50 border group-hover:scale-110 transition-transform duration-200">
                                                            {getTypeIcon(n.type)}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-sm group-hover:text-foreground/90 transition-colors">
                                                                        {n.title || "Platform Announcement"}
                                                                    </span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={`text-[10px] px-1.5 py-0 font-medium ${getTypeBadgeClass(n.type)}`}
                                                                    >
                                                                        {getTypeLabel(n.type)}
                                                                    </Badge>
                                                                    {!n.read && (
                                                                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-rose-500 hover:bg-rose-500 text-white">
                                                                            New
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground shrink-0">
                                                                    {format(new Date(n.created_at), 'MMM d, yyyy · h:mm a')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                                {n.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                    <Radio className="h-8 w-8 opacity-30" />
                                </div>
                                <p className="font-medium text-foreground text-base">
                                    {search ? "No broadcasts match your search" : "No broadcasts found"}
                                </p>
                                <p className="text-sm mt-1 max-w-xs mx-auto">
                                    {search
                                        ? "Try a different keyword or clear the search."
                                        : filter === "unread"
                                            ? "You're all caught up — no unread broadcasts."
                                            : "Platform announcements and updates will appear here."}
                                </p>
                                {(search || filter !== "all") && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => { setSearch(""); setFilter("all") }}
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Broadcast Detail Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => { if (!open) setSelectedNotification(null) }}>
                <DialogContent className="max-w-lg">
                    {selectedNotification && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-muted/60 border">
                                        {getTypeIcon(selectedNotification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <DialogTitle className="text-base font-semibold">
                                                {selectedNotification.title || "Platform Announcement"}
                                            </DialogTitle>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] px-1.5 font-medium ${getTypeBadgeClass(selectedNotification.type)}`}
                                            >
                                                {getTypeLabel(selectedNotification.type)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(selectedNotification.created_at), 'PPPP · h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="border-t pt-4">
                                <DialogDescription asChild>
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                        {selectedNotification.message}
                                    </p>
                                </DialogDescription>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
