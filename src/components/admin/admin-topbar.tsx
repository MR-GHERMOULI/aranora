"use client"

import { Bell, Search, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    is_read: boolean
    created_at: string
}

export function AdminTopbar() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        const { data } = await supabase
            .from("admin_notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter((n) => !n.is_read).length)
        }
    }

    async function markAsRead(id: string) {
        await supabase
            .from("admin_notifications")
            .update({ is_read: true })
            .eq("id", id)

        fetchNotifications()
    }

    async function markAllAsRead() {
        await supabase
            .from("admin_notifications")
            .update({ is_read: true })
            .eq("is_read", false)

        fetchNotifications()
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users, pages, settings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {notifications.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No notifications
                                </div>
                            ) : (
                                notifications.slice(0, 5).map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={cn(
                                            "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                            !notification.is_read && "bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {!notification.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                            <span className="font-medium text-sm">
                                                {notification.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </span>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}
