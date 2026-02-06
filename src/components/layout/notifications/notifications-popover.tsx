"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getNotifications, markAsRead, acceptNotificationInvite } from "./actions"
import { useRouter } from "next/navigation"

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchNotes = async () => {
            const data = await getNotifications()
            setNotifications(data)
        }
        fetchNotes()
        // In a real app we'd use realtime subscriptions here
    }, [open])

    const handleAccept = async (n: any) => {
        if (n.type === 'invite') {
            await acceptNotificationInvite(n.id, n.payload.collaboratorId)
            setNotifications(prev => prev.filter(item => item.id !== n.id))
            router.push(`/dashboard/projects/${n.payload.projectId}`)
        }
    }

    const handleDismiss = async (id: string) => {
        await markAsRead(id)
        setNotifications(prev => prev.filter(item => item.id !== id))
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
                                        <Button size="sm" onClick={() => handleAccept(n)} className="w-full">
                                            Accept
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDismiss(n.id)} className="w-full">
                                            Ignore
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(n.id)} className="text-xs h-7">
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
