"use client"

import { useState } from "react"
import { ShieldAlert, Users, Monitor, MapPin, Ban, UserCheck, ChevronDown, ChevronRight, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SecurityTableProps {
    initialData: any[]
}

export function SecurityTable({ initialData }: SecurityTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const blockUser = async (userId: string, identifier: string) => {
        if (!confirm("Are you sure you want to block this user?")) return
        
        setIsLoading(prev => ({ ...prev, [userId]: true }))
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "suspend" }),
            })
            if (res.ok) {
                // Refresh or update local state
                window.location.reload()
            } else {
                alert("Failed to block user")
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred")
        } finally {
            setIsLoading(prev => ({ ...prev, [userId]: false }))
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Flagged Access Groups</h2>
            
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identifier</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Users</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {initialData.map((group, idx) => {
                            const isExpanded = expandedRows[group.identifier]
                            return (
                                <tr key={group.identifier} className="group">
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleRow(group.identifier)}>
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        <Badge variant={group.type === 'IP Address' ? 'destructive' : 'outline'} className="bg-opacity-10">
                                            {group.type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground truncate max-w-[300px]">
                                        {group.identifier}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-bold">{group.count} users</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isExpanded ? (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <table className="w-full mt-4 text-left border-t border-dashed">
                                                    <thead>
                                                        <tr className="text-[10px] uppercase text-muted-foreground">
                                                            <th className="py-2">User</th>
                                                            <th className="py-2">Email</th>
                                                            <th className="py-2">Status</th>
                                                            <th className="py-2">Last Seen</th>
                                                            <th className="py-2 text-right">Block</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-dashed">
                                                        {group.users.map((user: any) => (
                                                            <tr key={user.id} className="text-xs">
                                                                <td className="py-2 font-medium">{user.full_name}</td>
                                                                <td className="py-2 text-muted-foreground">{user.company_email}</td>
                                                                <td className="py-2">
                                                                    <Badge className={cn(
                                                                        "text-[10px] px-1.5 py-0",
                                                                        user.account_status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                                                    )}>
                                                                        {user.account_status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-2 text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(user.last_access).toLocaleDateString()}
                                                                </td>
                                                                <td className="py-2 text-right">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                        disabled={isLoading[user.id] || user.account_status === 'suspended'}
                                                                        onClick={() => blockUser(user.id, group.identifier)}
                                                                    >
                                                                        <Ban className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => toggleRow(group.identifier)}>
                                                View Users
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {initialData.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No suspicious shared access detected.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
