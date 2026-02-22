"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, User, Crown, Shield, Users } from "lucide-react"

interface TeamMemberOption {
    id: string
    user_id: string
    role: string
    profiles: {
        id: string
        full_name: string
        email: string
        avatar_url?: string
    }
}

interface TeamMemberPickerProps {
    members: TeamMemberOption[]
    value?: string
    onChange: (userId: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function getRoleIcon(role: string) {
    switch (role) {
        case "owner":
            return <Crown className="h-3 w-3 text-amber-400" />
        case "admin":
            return <Shield className="h-3 w-3 text-blue-400" />
        default:
            return <Users className="h-3 w-3 text-zinc-400" />
    }
}

export function TeamMemberPicker({
    members,
    value,
    onChange,
    placeholder = "Assign to...",
    className,
    disabled = false,
}: TeamMemberPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selectedMember = members.find((m) => m.user_id === value)

    const filteredMembers = members.filter((m) => {
        if (!search) return true
        const name = m.profiles?.full_name?.toLowerCase() || ""
        const email = m.profiles?.email?.toLowerCase() || ""
        const q = search.toLowerCase()
        return name.includes(q) || email.includes(q)
    })

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150",
                    "bg-background hover:bg-accent/50 text-sm text-left",
                    "border-input hover:border-primary/40",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    isOpen && "ring-2 ring-ring ring-offset-1",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                {selectedMember ? (
                    <>
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                            {selectedMember.profiles?.avatar_url ? (
                                <img
                                    src={selectedMember.profiles.avatar_url}
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover"
                                />
                            ) : (
                                getInitials(selectedMember.profiles?.full_name || "?")
                            )}
                        </div>
                        <span className="truncate font-medium">
                            {selectedMember.profiles?.full_name || selectedMember.profiles?.email}
                        </span>
                    </>
                ) : (
                    <>
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{placeholder}</span>
                    </>
                )}
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* Search */}
                        {members.length > 5 && (
                            <div className="p-2 border-b">
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-sm bg-muted/50 border-none rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="max-h-[220px] overflow-y-auto p-1">
                            {/* Unassign option */}
                            <button
                                type="button"
                                onClick={() => {
                                    onChange("")
                                    setIsOpen(false)
                                    setSearch("")
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent text-sm transition-colors"
                            >
                                <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-muted-foreground italic">Unassigned</span>
                                {!value && (
                                    <Check className="h-4 w-4 text-primary ml-auto" />
                                )}
                            </button>

                            {filteredMembers.map((member) => (
                                <button
                                    key={member.user_id}
                                    type="button"
                                    onClick={() => {
                                        onChange(member.user_id)
                                        setIsOpen(false)
                                        setSearch("")
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent text-sm transition-colors",
                                        member.user_id === value && "bg-accent"
                                    )}
                                >
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                                        {member.profiles?.avatar_url ? (
                                            <img
                                                src={member.profiles.avatar_url}
                                                alt=""
                                                className="h-6 w-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(member.profiles?.full_name || "?")
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-medium truncate text-foreground">
                                            {member.profiles?.full_name || "Unknown"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                            {getRoleIcon(member.role)}
                                            {member.role} · {member.profiles?.email}
                                        </p>
                                    </div>
                                    {member.user_id === value && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </button>
                            ))}

                            {filteredMembers.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    No members found
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
