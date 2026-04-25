"use client"

import { useState, useTransition } from "react"
import { acceptInvitation, declineInvitation, PendingInvitation } from "./actions"
import { toast } from "sonner"
import {
    Briefcase,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Mail,
    UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface InvitationsClientProps {
    initialInvitations: PendingInvitation[]
}

function InvitationCard({ invitation, onAccept, onDecline, isProcessing }: {
    invitation: PendingInvitation
    onAccept: (id: string, collaboratorId: string, slug?: string, projectId?: string) => void
    onDecline: (id: string, collaboratorId: string) => void
    isProcessing: boolean
}) {
    const payload = invitation.payload
    const timeAgo = formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })

    return (
        <div
            className={`group relative bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/5 ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
        >
            {/* Subtle top gradient accent */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-brand-primary/20 border border-brand-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                            <p className="font-semibold text-foreground text-sm leading-tight">
                                {payload.inviterName || "Someone"}
                                {payload.inviterUsername && (
                                    <span className="ml-1.5 text-xs font-medium text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md">
                                        @{payload.inviterUsername}
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">invited you to collaborate</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/5 shrink-0">
                            Pending
                        </Badge>
                    </div>

                    {/* Project info */}
                    <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                        <div className="p-1.5 bg-brand-primary/10 rounded-lg">
                            <Briefcase className="h-3.5 w-3.5 text-brand-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Project</p>
                            <p className="text-sm font-semibold text-foreground leading-tight">{payload.projectName || "Unnamed Project"}</p>
                        </div>
                        {payload.role && (
                            <>
                                <div className="h-4 w-px bg-border mx-1" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Role</p>
                                    <p className="text-sm font-medium text-foreground capitalize">{payload.role}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border/50">
                <Button
                    onClick={() => onAccept(invitation.id, payload.collaboratorId, payload.projectSlug, payload.projectId)}
                    disabled={isProcessing}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-xl h-10 gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-brand-primary/20"
                    id={`accept-invitation-${invitation.id}`}
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    Accept Invitation
                </Button>
                <Button
                    onClick={() => onDecline(invitation.id, payload.collaboratorId)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 rounded-xl h-10 gap-2 hover:bg-destructive/5 hover:border-destructive/40 hover:text-destructive transition-all duration-200"
                    id={`decline-invitation-${invitation.id}`}
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    Decline
                </Button>
            </div>
        </div>
    )
}

export function InvitationsClient({ initialInvitations }: InvitationsClientProps) {
    const [invitations, setInvitations] = useState<PendingInvitation[]>(initialInvitations)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleAccept = (notificationId: string, collaboratorId: string, slug?: string, projectId?: string) => {
        setProcessingId(notificationId)
        startTransition(async () => {
            try {
                await acceptInvitation(notificationId, collaboratorId, slug, projectId)
                // acceptInvitation redirects on success — if we reach here, remove it
                setInvitations(prev => prev.filter(i => i.id !== notificationId))
                toast.success("Invitation accepted! Redirecting to project…")
            } catch (err: any) {
                if (err?.message === 'NEXT_REDIRECT') return // expected redirect
                toast.error(err?.message || "Failed to accept invitation")
                setProcessingId(null)
            }
        })
    }

    const handleDecline = (notificationId: string, collaboratorId: string) => {
        setProcessingId(notificationId)
        startTransition(async () => {
            try {
                await declineInvitation(notificationId, collaboratorId)
                setInvitations(prev => prev.filter(i => i.id !== notificationId))
                toast.success("Invitation declined.")
            } catch (err: any) {
                toast.error(err?.message || "Failed to decline invitation")
            } finally {
                setProcessingId(null)
            }
        })
    }

    if (invitations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-violet-500/20 border border-brand-primary/20 flex items-center justify-center">
                        <Mail className="h-9 w-9 text-brand-primary/60" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    You have no pending project invitations. When someone invites you to collaborate, it will appear here.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4 text-brand-primary" />
                    <span>
                        <span className="font-semibold text-foreground">{invitations.length}</span>{" "}
                        pending {invitations.length === 1 ? "invitation" : "invitations"}
                    </span>
                </div>
            </div>

            {/* Cards grid */}
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {invitations.map(invitation => (
                    <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        isProcessing={processingId === invitation.id}
                    />
                ))}
            </div>
        </div>
    )
}
