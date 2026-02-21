"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getNotifications, markAsRead, acceptNotificationInvite, declineNotificationInvite } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchNotes = async () => {
            const data = await getNotifications()
            setNotifications(data)
        }
        fetchNotes()
    }, [open])

    const handleAccept = async (n: any) => {
        if (n.type === 'invite') {
            setProcessingId(n.id)
            try {
                await acceptNotificationInvite(n.id, n.payload.collaboratorId)
                setNotifications(prev => prev.filter(item => item.id !== n.id))
                toast.success(`Joined ${n.payload.projectName}`)
                router.push(`/projects/${n.payload.projectId}`)
            } catch (error) {
                toast.error("Failed to accept")
            } finally {
                setProcessingId(null)
            }
        }
    }

    const handleDecline = async (n: any) => {
        setProcessingId(n.id)
        try {
            if (n.type === 'invite') {
                await declineNotificationInvite(n.id, n.payload.collaboratorId)
            } else {
                await markAsRead(n.id)
            }
            setNotifications(prev => prev.filter(item => item.id !== n.id))
        } catch (error) {
            toast.error("Action failed")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-zinc-400" />
                    {notifications.length > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b font-medium">Notifications</div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <div className="mb-2">
                                    {n.type === 'invite' ? (
                                        <p className="text-sm">
                                            <strong>{n.payload?.inviterName}</strong>
                                            {n.payload?.inviterUsername && <span className="text-xs text-violet-600 font-semibold ml-1">@{n.payload.inviterUsername}</span>}
                                            {" "}invited you to project <strong>{n.payload?.projectName}</strong>
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">{n.title || "Notification"}</p>
                                            <p className="text-sm text-muted-foreground">{n.message}</p>
                                        </div>
                                    )}
                                </div>

                                {n.type === 'invite' ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAccept(n)}
                                            className="w-full bg-brand-primary"
                                            disabled={processingId === n.id}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDecline(n)}
                                            className="w-full"
                                            disabled={processingId === n.id}
                                        >
                                            Ignore
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDecline(n)}
                                            className="text-xs h-7 hover:bg-brand-primary/10 hover:text-brand-primary"
                                            disabled={processingId === n.id}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
