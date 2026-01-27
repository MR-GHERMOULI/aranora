"use client"

import { useState } from "react"
import { Search, Filter, User, FileEdit, Settings, Monitor } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActivityLog {
    id: string
    admin_id: string | null
    admin_email: string | null
    action: string
    action_type: string | null
    target_id: string | null
    target_name: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}

interface ActivityLogTableProps {
    logs: ActivityLog[]
}

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.target_name?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = typeFilter === "all" || log.action_type === typeFilter

        return matchesSearch && matchesType
    })

    const getTypeIcon = (type: string | null) => {
        switch (type) {
            case "user":
                return <User className="h-4 w-4" />
            case "page":
                return <FileEdit className="h-4 w-4" />
            case "setting":
                return <Settings className="h-4 w-4" />
            default:
                return <Monitor className="h-4 w-4" />
        }
    }

    const getTypeBadge = (type: string | null) => {
        const styles: Record<string, string> = {
            user: "bg-blue-500/10 text-blue-600",
            page: "bg-green-500/10 text-green-600",
            setting: "bg-purple-500/10 text-purple-600",
            system: "bg-gray-500/10 text-gray-600",
        }
        return (
            <Badge className={styles[type || "system"] || styles.system}>
                {type || "system"}
            </Badge>
        )
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search actions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Type: {typeFilter === "all" ? "All" : typeFilter}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTypeFilter("all")}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("user")}>User</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("page")}>Page</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("setting")}>Setting</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("system")}>System</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Activity List */}
            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
                        No activity logs found
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                {getTypeIcon(log.action_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{log.action}</span>
                                    {getTypeBadge(log.action_type)}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <span>{log.admin_email || "System"}</span>
                                    {log.target_name && (
                                        <>
                                            <span>•</span>
                                            <span>Target: {log.target_name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground shrink-0">
                                {formatTimeAgo(log.created_at)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} activities
            </div>
        </>
    )
}
