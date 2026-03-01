"use client"

import { useState } from "react"
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Trash2, Eye } from "lucide-react"
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

interface User {
    id: string
    username: string | null
    full_name: string | null
    company_email: string | null
    country: string | null
    account_status: string
    created_at: string
    projects_count?: number
    invoices_count?: number
    collaborations_count?: number
}

interface UsersTableProps {
    initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || user.account_status === statusFilter

        return matchesSearch && matchesStatus
    })

    async function updateUserStatus(userId: string, status: string) {
        setIsLoading(true)
        const { error } = await supabase
            .from("profiles")
            .update({ account_status: status })
            .eq("id", userId)

        if (!error) {
            setUsers(users.map((u) =>
                u.id === userId ? { ...u, account_status: status } : u
            ))
        }
        setIsLoading(false)
    }

    async function deleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return
        }

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
        // Fetch additional stats
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
            case "suspended":
                return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Suspended</Badge>
            case "pending":
                return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Status: {statusFilter === "all" ? "All" : statusFilter}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                            All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                            Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>
                            Suspended
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                            Pending
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Country</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                                    <span className="text-sm font-medium">
                                                        {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.full_name || "No Name"}</p>
                                                    <p className="text-sm text-muted-foreground">@{user.username || "unknown"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{user.company_email || "-"}</td>
                                        <td className="px-4 py-3 text-sm">{user.country || "-"}</td>
                                        <td className="px-4 py-3">{getStatusBadge(user.account_status || "active")}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString('en-US')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isLoading}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.account_status !== "active" && (
                                                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.account_status !== "suspended" && (
                                                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, "suspended")}>
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Suspend
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => deleteUser(user.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {(selectedUser.full_name || "U").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.full_name || "No Name"}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedUser.company_email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg bg-muted p-4 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.projects_count}</p>
                                    <p className="text-xs text-muted-foreground">Projects</p>
                                </div>
                                <div className="rounded-lg bg-muted p-4 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.collaborations_count}</p>
                                    <p className="text-xs text-muted-foreground">Partnerships</p>
                                </div>
                                <div className="rounded-lg bg-muted p-4 text-center">
                                    <p className="text-2xl font-bold">{selectedUser.invoices_count}</p>
                                    <p className="text-xs text-muted-foreground">Invoices</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Username</span>
                                    <span>@{selectedUser.username || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Country</span>
                                    <span>{selectedUser.country || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    {getStatusBadge(selectedUser.account_status || "active")}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span>{new Date(selectedUser.created_at).toLocaleDateString('en-US')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
