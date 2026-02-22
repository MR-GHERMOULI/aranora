"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    ListTodo,
    Users,
    Briefcase,
    FileText,
    Calendar,
    BarChart,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    Timer,
    Radio,
    Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { GlobalSearch } from "./search"
import { LogoutButton } from "./logout-button"
import { NotificationsPopover } from "./notifications/notifications-popover"
import { Mail } from "lucide-react"
import { getPendingInvitationsCount } from "./notifications/actions"
import { useEffect } from "react"
import { WorkspaceSwitcher } from "./workspace-switcher"

interface Team {
    id: string
    name: string
    owner_id: string
    role: string
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    teams?: Team[]
    activeTeamId?: string
}

export function Sidebar({ className, teams = [], activeTeamId = "" }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [inviteCount, setInviteCount] = useState(0)

    useEffect(() => {
        const fetchCount = async () => {
            const count = await getPendingInvitationsCount()
            setInviteCount(count)
        }
        fetchCount()
    }, [])

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "Broadcasts",
            icon: Radio,
            href: "/broadcasts",
            color: "text-amber-400",
        },
        {
            label: "Invitations",
            icon: Mail,
            href: "/invitations",
            color: "text-red-500",
            badge: inviteCount > 0 ? inviteCount : null,
        },
        {
            label: "Tasks",
            icon: ListTodo,
            href: "/tasks",
            color: "text-indigo-500",
        },
        {
            label: "Clients",
            icon: Users,
            href: "/clients",
            color: "text-violet-500",
        },
        {
            label: "Collaborators",
            icon: Users,
            href: "/collaborators",
            color: "text-cyan-500",
        },
        {
            label: "Projects",
            icon: Briefcase,
            href: "/projects",
            color: "text-pink-700",
        },
        {
            label: "Contracts",
            icon: FileText,
            href: "/contracts",
            color: "text-emerald-500",
        },
        {
            label: "Invoices",
            icon: FileText,
            href: "/invoices",
            color: "text-orange-700",
        },
        {
            label: "Subscriptions",
            icon: CreditCard,
            href: "/subscriptions",
            color: "text-blue-500",
        },
        {
            label: "Calendar",
            icon: Calendar,
            href: "/calendar",
            color: "text-emerald-500",
        },
        {
            label: "Time Tracking",
            icon: Timer,
            href: "/time-tracking",
            color: "text-amber-500",
        },
        {
            label: "Reports",
            icon: BarChart,
            href: "/reports",
            color: "text-green-700",
        },
    ]

    return (
        <>
            <div className="md:hidden p-4 flex items-center justify-between border-b bg-background">
                <div className="flex items-center gap-2">

                    <div className="relative z-20 flex items-center text-lg font-medium">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 h-6 w-6 text-primary"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        Aranora
                    </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            <div
                className={cn(
                    "space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white fixed inset-y-0 left-0 z-50 w-72 transition-transform transform md:relative md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    className
                )}
            >
                <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
                    <Link href="/dashboard" className="flex items-center pl-3 mb-5 shrink-0">
                        <div className="relative z-20 flex items-center text-xl font-bold">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2 h-8 w-8 text-secondary"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            Aranora
                        </div>
                    </Link>

                    {/* Workspace Switcher */}
                    <div className="shrink-0 mb-4 px-1">
                        <WorkspaceSwitcher teams={teams} activeTeamId={activeTeamId} />
                    </div>

                    <div className="shrink-0 mb-4 px-1">
                        <GlobalSearch />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                    pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </div>
                                {route.badge && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto">
                                        {route.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="px-3 py-2 mt-auto border-t border-white/10 bg-slate-900/50 backdrop-blur-sm shrink-0">
                    <div className="mb-2 pl-3 flex items-center gap-2">
                        <NotificationsPopover />
                        <ModeToggle />
                    </div>
                    <Link
                        href="/settings"
                        className={cn(
                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
                        )}
                    >
                        <div className="flex items-center flex-1">
                            <Settings className="h-5 w-5 mr-3 text-gray-500" />
                            Settings
                        </div>
                    </Link>
                    <LogoutButton />
                </div>
            </div>
        </>
    )
}
