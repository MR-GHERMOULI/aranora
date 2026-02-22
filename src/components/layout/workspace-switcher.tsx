"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Building2,
    Check,
    ChevronsUpDown,
    Plus,
    Shield,
    Crown,
    Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setActiveTeamId } from "@/lib/team-helpers"
import { createTeam } from "@/app/actions/team-actions"

interface Team {
    id: string
    name: string
    owner_id: string
    role: string
}

interface WorkspaceSwitcherProps {
    teams: Team[]
    activeTeamId: string
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

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function WorkspaceSwitcher({ teams, activeTeamId }: WorkspaceSwitcherProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isCreating, setIsCreating] = useState(false)

    const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0]

    async function handleSwitch(teamId: string) {
        if (teamId === activeTeamId) {
            setIsOpen(false)
            return
        }

        startTransition(async () => {
            try {
                await setActiveTeamId(teamId)
                setIsOpen(false)
                router.refresh()
                toast.success("Workspace switched!")
            } catch (err) {
                toast.error("Failed to switch workspace")
            }
        })
    }

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsCreating(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await createTeam(formData)
            if (result.error) {
                toast.error(result.error)
            } else if (result.success && result.teamId) {
                toast.success("Workspace created!")
                await setActiveTeamId(result.teamId)
                setShowCreateDialog(false)
                router.refresh()
            }
        } catch {
            toast.error("Failed to create workspace")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        "hover:bg-white/10 text-white",
                        "border border-white/[0.08] hover:border-white/20",
                        "bg-gradient-to-r from-white/[0.06] to-white/[0.02]",
                        isOpen && "bg-white/10 border-white/20"
                    )}
                >
                    {/* Workspace Avatar */}
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                        {activeTeam ? getInitials(activeTeam.name) : "?"}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold truncate">
                            {activeTeam?.name || "Select Workspace"}
                        </p>
                        <p className="text-[10px] text-zinc-400 capitalize flex items-center gap-1">
                            {activeTeam && getRoleIcon(activeTeam.role)}
                            {activeTeam?.role || "member"}
                        </p>
                    </div>

                    <ChevronsUpDown className="h-4 w-4 text-zinc-400 shrink-0" />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2.5 py-1.5">
                                    Workspaces
                                </p>
                                {teams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => handleSwitch(team.id)}
                                        disabled={isPending}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150",
                                            "hover:bg-white/10 text-left",
                                            team.id === activeTeamId &&
                                            "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                                                team.id === activeTeamId
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-white/10 text-zinc-300"
                                            )}
                                        >
                                            {getInitials(team.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-zinc-100">
                                                {team.name}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 capitalize flex items-center gap-1">
                                                {getRoleIcon(team.role)}
                                                {team.role}
                                            </p>
                                        </div>
                                        {team.id === activeTeamId && (
                                            <Check className="h-4 w-4 text-primary shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-white/10 p-1.5">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setShowCreateDialog(true)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
                                >
                                    <div className="h-7 w-7 rounded-md border border-dashed border-zinc-600 flex items-center justify-center">
                                        <Plus className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-sm font-medium">
                                        Create Workspace
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Workspace Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Create New Workspace</DialogTitle>
                        <DialogDescription>
                            Create a collaborative workspace for your team.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="py-4">
                            <div className="space-y-2">
                                <Label htmlFor="ws-name">Workspace Name</Label>
                                <Input
                                    id="ws-name"
                                    name="name"
                                    placeholder="e.g. Design Agency"
                                    required
                                    disabled={isCreating}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
