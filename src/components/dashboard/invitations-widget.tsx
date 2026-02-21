"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, User, Check, X, Bell } from "lucide-react"
import { acceptNotificationInvite, declineNotificationInvite } from "@/components/layout/notifications/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Invitation {
    id: string
    type: string
    payload: {
        projectId: string
        projectName: string
        inviterName: string
        inviterUsername?: string
        collaboratorId: string
    }
    created_at: string
}

interface InvitationsWidgetProps {
    invitations: Invitation[]
}

export function InvitationsWidget({ invitations: initialInvitations }: InvitationsWidgetProps) {
    const [invitations, setInvitations] = useState(initialInvitations)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const router = useRouter()

    if (invitations.length === 0) return null

    const handleAccept = async (invite: Invitation) => {
        setProcessingId(invite.id)
        try {
            await acceptNotificationInvite(invite.id, invite.payload.collaboratorId)
            setInvitations(prev => prev.filter(i => i.id !== invite.id))
            toast.success(`Joined project: ${invite.payload.projectName}`)
            router.push(`/projects/${invite.payload.projectId}`)
        } catch (error) {
            toast.error("Failed to accept invitation")
        } finally {
            setProcessingId(null)
        }
    }

    const handleDecline = async (invite: Invitation) => {
        setProcessingId(invite.id)
        try {
            await declineNotificationInvite(invite.id, invite.payload.collaboratorId)
            setInvitations(prev => prev.filter(i => i.id !== invite.id))
            toast.info("Invitation declined")
        } catch (error) {
            toast.error("Failed to decline invitation")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-brand-primary font-semibold">
                <Bell className="h-5 w-5 animate-bounce" />
                <h2 className="text-lg">Project Invitations</h2>
                <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                    {invitations.length} New
                </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {invitations.map((invite) => (
                    <Card key={invite.id} className="relative overflow-hidden border-2 border-brand-primary/20 group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                                    <Briefcase className="h-6 w-6 text-brand-primary" />
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <h3 className="font-bold text-lg truncate">{invite.payload.projectName}</h3>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        <span className="truncate">From {invite.payload.inviterName}</span>
                                        {invite.payload.inviterUsername && (
                                            <span className="text-brand-primary font-medium text-[10px] px-1.5 py-0.5 bg-brand-primary/5 rounded">
                                                @{invite.payload.inviterUsername}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-brand-primary hover:bg-brand-primary-light"
                                    onClick={() => handleAccept(invite)}
                                    disabled={processingId === invite.id}
                                >
                                    <Check className="h-4 w-4 mr-1.5" />
                                    Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                    onClick={() => handleDecline(invite)}
                                    disabled={processingId === invite.id}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
