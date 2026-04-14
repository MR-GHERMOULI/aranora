"use client"

import { useState } from "react"
import { Search, MoreHorizontal, UserCheck, UserX, Trash2, Eye, Crown, Gift, Clock, CreditCard, AlertTriangle, ShieldAlert, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

type UserTier = "owner" | "paid" | "promo" | "trial" | "expired"

interface User {
    id: string
    username: string | null
    full_name: string | null
    company_email: string | null
    phone: string | null
    country: string | null
    account_status: string
    created_at: string
    is_admin?: boolean
    subscription_status: string | null
    trial_ends_at: string | null
    tier: UserTier
    daysRemaining: number | null
    promoInfo: { free_months: number; code: string } | null
    billingInfo: { status: string; plan_type: string; current_period_end: string | null } | null
    projects_count?: number
    invoices_count?: number
    collaborations_count?: number
}

interface UsersTableProps {
    initialUsers: User[]
}

const TIER_FILTERS = [
    { value: "all", label: "All Users" },
    { value: "owner", label: "Owners" },
    { value: "promo", label: "Promo Friends" },
    { value: "trial", label: "Free Trial" },
    { value: "paid", label: "Paid" },
    { value: "expired", label: "Expired" },
] as const

const tierConfig: Record<UserTier, { label: string; emoji: string; color: string; icon: typeof Crown; sectionBg: string }> = {
    owner: {
        label: "Platform Owners",
        emoji: "👑",
        color: "bg-amber-500/10 text-amber-600 border-amber-200/60",
        icon: Crown,
        sectionBg: "bg-amber-500/5 border-l-4 border-l-amber-500",
    },
    promo: {
        label: "Promo Friends",
        emoji: "🎁",
        color: "bg-violet-500/10 text-violet-600 border-violet-200/60",
        icon: Gift,
        sectionBg: "bg-violet-500/5 border-l-4 border-l-violet-500",
    },
    trial: {
        label: "Free Trial",
        emoji: "⏳",
        color: "bg-blue-500/10 text-blue-600 border-blue-200/60",
        icon: Clock,
        sectionBg: "bg-blue-500/5 border-l-4 border-l-blue-500",
    },
    paid: {
        label: "Paid Accounts",
        emoji: "💎",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/60",
        icon: CreditCard,
        sectionBg: "bg-emerald-500/5 border-l-4 border-l-emerald-500",
    },
    expired: {
        label: "Expired Accounts",
        emoji: "⚠️",
        color: "bg-red-500/10 text-red-600 border-red-200/60",
        icon: AlertTriangle,
        sectionBg: "bg-red-500/5 border-l-4 border-l-red-500",
    },
}

const ACTIVATION_OPTIONS = [
    { months: 1, label: "1 Month", description: "30 days of access" },
    { months: 6, label: "6 Months", description: "~180 days of access" },
    { months: 12, label: "1 Year", description: "365 days of access" },
]

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [searchQuery, setSearchQuery] = useState("")
    const [tierFilter, setTierFilter] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    // Dialog states
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isActivateOpen, setIsActivateOpen] = useState(false)
    const [isSuspendOpen, setIsSuspendOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [actionTarget, setActionTarget] = useState<User | null>(null)

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTier = tierFilter === "all" || user.tier === tierFilter
        return matchesSearch && matchesTier
    })

    const tierOrder: UserTier[] = ["owner", "paid", "promo", "trial", "expired"]
    const groupedUsers: Record<UserTier, User[]> = { owner: [], paid: [], promo: [], trial: [], expired: [] }
    filteredUsers.forEach(u => groupedUsers[u.tier].push(u))

    // ── Activate: extend trial by N months ──
    async function activateUser(userId: string, months: number) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "activate", months }),
            })
            const result = await response.json()
            if (!response.ok) {
                alert(result.error || "Failed to activate user")
                return
            }
            // Update local state
            const newTrialEnd = new Date()
            newTrialEnd.setMonth(newTrialEnd.getMonth() + months)
            const daysRemaining = Math.ceil((newTrialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            setUsers(users.map(u =>
                u.id === userId ? {
                    ...u,
                    account_status: "active",
                    subscription_status: "trialing",
                    trial_ends_at: newTrialEnd.toISOString(),
                    tier: "trial" as UserTier,
                    daysRemaining,
                } : u
            ))
            setIsActivateOpen(false)
            setActionTarget(null)
        } catch (error) {
            console.error("Error activating user:", error)
            alert("Failed to activate user")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Suspend: block account ──
    async function suspendUser(userId: string) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "suspend" }),
            })
            const result = await response.json()
            if (!response.ok) {
                alert(result.error || "Failed to suspend user")
                return
            }
            setUsers(users.map(u =>
                u.id === userId ? {
                    ...u,
                    account_status: "suspended",
                    subscription_status: "expired",
                    tier: "expired" as UserTier,
                    daysRemaining: null,
                } : u
            ))
            setIsSuspendOpen(false)
            setActionTarget(null)
        } catch (error) {
            console.error("Error suspending user:", error)
            alert("Failed to suspend user")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Delete: permanently remove ──
    async function deleteUser(userId: string) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            })
            const result = await response.json()
            if (!response.ok) {
                alert(result.error || "Failed to delete user")
                return
            }
            setUsers(users.filter(u => u.id !== userId))
            setIsDeleteOpen(false)
            setActionTarget(null)
        } catch (error) {
            console.error("Error deleting user:", error)
            alert("Failed to delete user")
        } finally {
            setIsLoading(false)
        }
    }

    async function viewUserDetails(user: User) {
        const [
            { count: projectsCount },
            { count: invoicesCount },
            { count: collaborationsCount },
        ] = await Promise.all([
            supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("invoices").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("project_collaborators").select("*", { count: "exact", head: true }).eq("collaborator_email", user.company_email),
        ])
        setSelectedUser({
            ...user,
            projects_count: projectsCount || 0,
            invoices_count: invoicesCount || 0,
            collaborations_count: collaborationsCount || 0,
        })
        setIsDetailsOpen(true)
    }

    const getAccountStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-[10px]">Active</Badge>
            case "suspended":
                return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 text-[10px]">Suspended</Badge>
            case "pending":
                return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 text-[10px]">Pending</Badge>
            default:
                return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
        }
    }

    const getTierBadge = (user: User) => {
        const config = tierConfig[user.tier]
        return (
            <Badge className={`${config.color} text-[10px] font-semibold border`}>
                {config.emoji} {config.label.split(" ").pop()}
            </Badge>
        )
    }

    const getSubscriptionInfo = (user: User) => {
        if (user.tier === "owner") {
            return <span className="text-xs font-medium text-amber-600">♾️ Lifetime</span>
        }
        if (user.tier === "paid") {
            return (
                <div className="text-xs">
                    <span className="font-medium text-emerald-600">{user.billingInfo?.plan_type || "Pro"}</span>
                    {user.daysRemaining !== null && (
                        <span className="text-muted-foreground ml-1">· {user.daysRemaining}d left</span>
                    )}
                </div>
            )
        }
        if (user.tier === "promo") {
            return (
                <div className="text-xs">
                    <span className="font-medium text-violet-600">{user.promoInfo?.free_months}mo free</span>
                    {user.daysRemaining !== null && (
                        <span className="text-muted-foreground ml-1">· {user.daysRemaining}d left</span>
                    )}
                </div>
            )
        }
        if (user.tier === "trial") {
            return (
                <div className="text-xs">
                    <span className="font-medium text-blue-600">Trial</span>
                    {user.daysRemaining !== null && (
                        <span className={`ml-1 ${user.daysRemaining <= 7 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            · {user.daysRemaining}d left
                        </span>
                    )}
                </div>
            )
        }
        if (user.account_status === "suspended") {
            return <span className="text-xs text-red-500 font-medium">🚫 Suspended</span>
        }
        return <span className="text-xs text-red-500 font-medium">Expired</span>
    }

    const renderUserRow = (user: User) => (
        <tr key={user.id} className={`transition-colors hover:bg-muted/30 ${user.tier === "owner" ? "bg-amber-500/[0.03]" : ""}`}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        user.tier === "owner" ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" :
                        user.tier === "paid" ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" :
                        user.tier === "promo" ? "bg-gradient-to-br from-violet-400 to-violet-600 text-white" :
                        "bg-gradient-to-br from-primary/20 to-secondary/20"
                    }`}>
                        <span className="text-sm font-medium">
                            {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name || "No Name"}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username || "unknown"}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">{user.company_email || "—"}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone || "—"}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{user.country || "—"}</td>
            <td className="px-4 py-3">{getTierBadge(user)}</td>
            <td className="px-4 py-3">{getSubscriptionInfo(user)}</td>
            <td className="px-4 py-3">{getAccountStatusBadge(user.account_status || "active")}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td className="px-4 py-3 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        {!user.is_admin && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setActionTarget(user); setIsActivateOpen(true); }}>
                                    <Zap className="mr-2 h-4 w-4 text-emerald-500" />
                                    <span className="text-emerald-600 font-medium">Activate</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActionTarget(user); setIsSuspendOpen(true); }}>
                                    <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                                    <span className="text-amber-600 font-medium">Suspend</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setActionTarget(user); setIsDeleteOpen(true); }}>
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                    <span className="text-red-600 font-medium">Delete</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 flex-wrap">
                    {TIER_FILTERS.map(filter => (
                        <Button
                            key={filter.value}
                            variant={tierFilter === filter.value ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setTierFilter(filter.value)}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>

                        {tierOrder.map(tier => {
                            const tierUsers = groupedUsers[tier]
                            if (tierUsers.length === 0) return null
                            const config = tierConfig[tier]
                            const TierIcon = config.icon

                            return (
                                <tbody key={tier} className="divide-y border-b-2 border-muted/60">
                                    <tr>
                                        <td colSpan={9} className={`px-4 py-2.5 ${config.sectionBg}`}>
                                            <div className="flex items-center gap-2">
                                                <TierIcon className="h-3.5 w-3.5" />
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {config.emoji} {config.label}
                                                </span>
                                                <span className="text-xs font-medium text-muted-foreground ml-1">
                                                    ({tierUsers.length})
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {tierUsers.map(user => renderUserRow(user))}
                                </tbody>
                            )
                        })}

                        {filteredUsers.length === 0 && (
                            <tbody>
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredUsers.length} of {users.length} users</span>
            </div>

            {/* ════════════════════════════════════════════════════════════
                ACTIVATE DIALOG — Choose duration: 1 month, 6 months, 1 year
               ════════════════════════════════════════════════════════════ */}
            <Dialog open={isActivateOpen} onOpenChange={(open) => { setIsActivateOpen(open); if (!open) setActionTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-emerald-500" />
                            </div>
                            Activate Account
                        </DialogTitle>
                        <DialogDescription>
                            Grant <span className="font-semibold text-foreground">{actionTarget?.full_name || actionTarget?.company_email}</span> access to the platform. Choose the duration:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        {ACTIVATION_OPTIONS.map((option) => (
                            <button
                                key={option.months}
                                disabled={isLoading}
                                onClick={() => actionTarget && activateUser(actionTarget.id, option.months)}
                                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                        <Clock className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">{option.label}</p>
                                        <p className="text-xs text-muted-foreground">{option.description}</p>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    Select
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsActivateOpen(false); setActionTarget(null); }} disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════
                SUSPEND DIALOG — Confirm account suspension
               ════════════════════════════════════════════════════════════ */}
            <Dialog open={isSuspendOpen} onOpenChange={(open) => { setIsSuspendOpen(open); if (!open) setActionTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                            </div>
                            Suspend Account
                        </DialogTitle>
                        <DialogDescription>
                            This will suspend <span className="font-semibold text-foreground">{actionTarget?.full_name || actionTarget?.company_email}</span>&apos;s account and block all platform access. They will be treated as an expired account and will only be able to view their data in read-only mode until you manually re-activate them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-500/5 border border-amber-200/40 rounded-xl p-4 my-2">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-700 mb-1">What happens when suspended:</p>
                                <ul className="text-amber-600/80 space-y-1 text-xs">
                                    <li>• All write operations (create, edit, delete) will be blocked</li>
                                    <li>• User will see a read-only banner on their dashboard</li>
                                    <li>• Account remains suspended until you activate it again</li>
                                    <li>• User&apos;s existing data is preserved and viewable</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setIsSuspendOpen(false); setActionTarget(null); }} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => actionTarget && suspendUser(actionTarget.id)}
                            disabled={isLoading}
                        >
                            {isLoading ? "Suspending..." : "Suspend Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════
                DELETE DIALOG — Confirm permanent deletion
               ════════════════════════════════════════════════════════════ */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setActionTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </div>
                            Delete Account Permanently
                        </DialogTitle>
                        <DialogDescription>
                            You are about to permanently delete <span className="font-semibold text-foreground">{actionTarget?.full_name || actionTarget?.company_email}</span>&apos;s account. This action <span className="font-semibold text-red-500">cannot be undone</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-500/5 border border-red-200/40 rounded-xl p-4 my-2">
                        <div className="flex items-start gap-3">
                            <Trash2 className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-red-700 mb-1">This will permanently remove:</p>
                                <ul className="text-red-600/80 space-y-1 text-xs">
                                    <li>• The user&apos;s profile and all account data</li>
                                    <li>• All projects, tasks, and invoices</li>
                                    <li>• All contracts and intake forms</li>
                                    <li>• Authentication credentials</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setActionTarget(null); }} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => actionTarget && deleteUser(actionTarget.id)}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════
                VIEW DETAILS DIALOG
               ════════════════════════════════════════════════════════════ */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center shrink-0 ${
                                    selectedUser.tier === "owner" ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                                    selectedUser.tier === "paid" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
                                    selectedUser.tier === "promo" ? "bg-gradient-to-br from-violet-400 to-violet-600" :
                                    "bg-gradient-to-br from-primary to-secondary"
                                }`}>
                                    <span className="text-2xl font-bold text-white">
                                        {(selectedUser.full_name || "U").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        {selectedUser.full_name || "No Name"}
                                        {getTierBadge(selectedUser)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{selectedUser.company_email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-muted/50 p-3 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.projects_count}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Projects</p>
                                </div>
                                <div className="rounded-xl bg-muted/50 p-3 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.collaborations_count}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Partnerships</p>
                                </div>
                                <div className="rounded-xl bg-muted/50 p-3 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.invoices_count}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Invoices</p>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Username</span>
                                    <span className="font-medium">@{selectedUser.username || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone</span>
                                    <span className="font-medium">{selectedUser.phone || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Country</span>
                                    <span className="font-medium">{selectedUser.country || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account Status</span>
                                    {getAccountStatusBadge(selectedUser.account_status || "active")}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Subscription Tier</span>
                                    {getSubscriptionInfo(selectedUser)}
                                </div>
                                {selectedUser.promoInfo && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Promo Code</span>
                                        <span className="font-mono text-xs bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded">{selectedUser.promoInfo.code}</span>
                                    </div>
                                )}
                                {selectedUser.daysRemaining !== null && selectedUser.tier !== "owner" && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Days Remaining</span>
                                        <span className={`font-bold ${selectedUser.daysRemaining <= 7 ? "text-red-500" : "text-foreground"}`}>
                                            {selectedUser.daysRemaining} days
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
