"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    FileEdit,
    Settings,
    Activity,
    Menu,
    X,
    Shield,
    Mail,
    Radio
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { createClient } from "@/lib/supabase/client"

interface AdminSidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AdminSidebar({ className }: AdminSidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // Simple fetch for unread count
        const fetchUnread = async () => {
            const supabase = createClient()
            const { count } = await supabase
                .from("contact_messages")
                .select("*", { count: "exact", head: true })
                .eq("is_read", false)
            setUnreadCount(count || 0)
        }
        fetchUnread()
    }, [])

    const routes = [
        {
            label: "Dashboard",
            labelAr: "لوحة التحكم",
            icon: LayoutDashboard,
            href: "/admin",
            color: "text-sky-500",
        },
        {
            label: "Users",
            labelAr: "المستخدمين",
            icon: Users,
            href: "/admin/users",
            color: "text-violet-500",
        },
        {
            label: "Projects",
            labelAr: "المشاريع",
            icon: Briefcase,
            href: "/admin/projects",
            color: "text-pink-500",
        },
        {
            label: "Invoices",
            labelAr: "الفواتير",
            icon: FileText,
            href: "/admin/invoices",
            color: "text-orange-500",
        },
        {
            label: "Pages",
            labelAr: "الصفحات",
            icon: FileEdit,
            href: "/admin/pages",
            color: "text-emerald-500",
        },
        {
            label: "Messages",
            labelAr: "الرسائل",
            icon: Mail,
            href: "/admin/messages",
            color: "text-blue-500",
            badge: unreadCount > 0 ? unreadCount : null,
        },
        {
            label: "Broadcasts",
            labelAr: "التعاميم",
            icon: Radio,
            href: "/admin/broadcasts",
            color: "text-purple-500",
        },
        {
            label: "Settings",
            labelAr: "الإعدادات",
            icon: Settings,
            href: "/admin/settings",
            color: "text-gray-400",
        },
        {
            label: "Activity Log",
            labelAr: "سجل النشاط",
            icon: Activity,
            href: "/admin/activity",
            color: "text-amber-500",
        },
    ]

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden p-4 flex items-center justify-between border-b bg-background fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">Admin Panel</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col transition-transform duration-300 lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    className
                )}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-700/50">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Aranora</h1>
                            <p className="text-xs text-slate-400">Admin Dashboard</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {routes.map((route) => {
                        const isActive = pathname === route.href ||
                            (route.href !== "/admin" && pathname.startsWith(route.href))

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-white border border-primary/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                )}
                            >
                                <route.icon className={cn("h-5 w-5", isActive ? route.color : "")} />
                                <span>{route.label}</span>
                                {/* @ts-ignore */}
                                {route.badge && (
                                    <span className="ml-auto bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {/* @ts-ignore */}
                                        {route.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <ModeToggle />
                        <Link
                            href="/dashboard"
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back to App
                        </Link>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-400">Logged in as</p>
                        <p className="text-sm font-medium truncate">Administrator</p>
                    </div>
                </div>
            </div>
        </>
    )
}
