"use client"

import { useState } from "react"
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Trash2, Eye, Crown, Gift, Clock, CreditCard, AlertTriangle } from "lucide-react"
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

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [searchQuery, setSearchQuery] = useState("")
    const [tierFilter, setTierFilter] = useState<string>("all")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesTier = tierFilter === "all" || user.tier === tierFilter

        return matchesSearch && matchesTier
    })

    // Sort users into tier groups (maintaining the order)
    const tierOrder: UserTier[] = ["owner", "paid", "promo", "trial", "expired"]
    const groupedUsers: Record<UserTier, User[]> = {
        owner: [], paid: [], promo: [], trial: [], expired: []
    }
    filteredUsers.forEach(u => groupedUsers[u.tier].push(u))

    async function updateUserStatus(userId: string, status: string) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, status }),
            })
            const result = await response.json()
            if (!response.ok) {
                alert(result.error || "Failed to update user status")
                return
            }
            setUsers(users.map((u) =>
                u.id === userId ? { ...u, account_status: status } : u
            ))
        } catch (error) {
            console.error("Error updating user status:", error)
            alert("Failed to update user status")
        } finally {
            setIsLoading(false)
        }
    }

    async function deleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return
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
            setUsers(users.filter((u) => u.id !== userId))
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
        // expired
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
                        <p className="font-medium text-sm flex items-center gap-1.5 truncate">
                            {user.full_name || "No Name"}
                        </p>
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
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!user.is_admin && user.account_status !== "active" && (
                            <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                            </DropdownMenuItem>
                        )}
                        {!user.is_admin && user.account_status !== "suspended" && (
                            <DropdownMenuItem onClick={() => updateUserStatus(user.id, "suspended")}>
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend
                            </DropdownMenuItem>
                        )}
                        {!user.is_admin && <DropdownMenuSeparator />}
                        {!user.is_admin && (
                            <DropdownMenuItem
                                onClick={() => deleteUser(user.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
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
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
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
                <span>
                    Showing {filteredUsers.length} of {users.length} users
                </span>
            </div>

            {/* User Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-5">
                            {/* User header */}
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

                            {/* Activity stats */}
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

                            {/* Info */}
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
