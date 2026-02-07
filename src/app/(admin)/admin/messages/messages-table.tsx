"use client"

import { useState } from "react"
import { Search, Filter, Mail, MailOpen, Trash2, Calendar, User, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

import { toast } from "sonner"
import type { ContactMessage } from "@/types"

interface MessagesTableProps {
    initialMessages: ContactMessage[]
}

export function MessagesTable({ initialMessages }: MessagesTableProps) {
    const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const filteredMessages = messages.filter((msg) => {
        const matchesSearch =
            msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.message.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            statusFilter === "all" ? true :
                statusFilter === "unread" ? !msg.is_read :
                    statusFilter === "read" ? msg.is_read : true

        return matchesSearch && matchesStatus
    })

    async function markAsRead(id: string) {
        // Optimistic update
        setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))

        // Background update
        const { error } = await supabase
            .from("contact_messages")
            .update({ is_read: true })
            .eq("id", id)

        if (error) {
            toast.error("Failed to mark message as read")
            // Revert optimistic update
            setMessages(messages.map(m => m.id === id ? { ...m, is_read: false } : m))
        } else {
            router.refresh()
        }
    }

    async function deleteMessage(id: string) {
        if (!confirm("Are you sure you want to delete this message?")) return

        setIsLoading(true)
        const { error } = await supabase
            .from("contact_messages")
            .delete()
            .eq("id", id)

        if (!error) {
            setMessages(messages.filter(m => m.id !== id))
            if (selectedMessage?.id === id) {
                setIsDetailsOpen(false)
            }
            toast.success("Message deleted successfully")
            router.refresh()
        } else {
            toast.error("Failed to delete message")
        }
        setIsLoading(false)
    }

    function viewMessage(msg: ContactMessage) {
        setSelectedMessage(msg)
        setIsDetailsOpen(true)
        if (!msg.is_read) {
            markAsRead(msg.id)
        }
    }

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Status: {statusFilter === "all" ? "All" : statusFilter === "read" ? "Read" : "Unread"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("unread")}>Unread</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("read")}>Read</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filteredMessages.length === 0 ? (
                    <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
                        No messages found
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${msg.is_read ? "bg-card hover:bg-muted/50" : "bg-primary/5 border-primary/20"
                                }`}
                            onClick={() => viewMessage(msg)}
                        >
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${msg.is_read ? "bg-transparent" : "bg-primary"}`} />

                            <div className="flex-1 min-w-0 grid gap-1">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${!msg.is_read && "text-primary"}`}>
                                            {msg.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            &lt;{msg.email}&gt;
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                        {new Date(msg.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h4 className={`text-sm ${!msg.is_read ? "font-semibold" : "font-medium"}`}>
                                    {msg.subject || "(No Subject)"}
                                </h4>

                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {msg.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteMessage(msg.id)
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredMessages.length} of {messages.length} messages
            </div>

            {/* Message Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <DialogTitle className="text-xl">
                                {selectedMessage?.subject || "(No Subject)"}
                            </DialogTitle>
                            <span className="text-xs text-muted-foreground mt-1">
                                {selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}
                            </span>
                        </div>
                        <DialogDescription>
                            From: <span className="font-medium text-foreground">{selectedMessage?.name}</span>
                            <span className="mx-2 text-muted-foreground">&lt;{selectedMessage?.email}&gt;</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                        {selectedMessage?.message}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="destructive"
                            onClick={() => selectedMessage && deleteMessage(selectedMessage.id)}
                            disabled={isLoading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                            Close
                        </Button>
                        <Button asChild>
                            <a href={`mailto:${selectedMessage?.email}?subject=${encodeURIComponent(`Re: ${selectedMessage?.subject || "Inquiry"}`)}&body=${encodeURIComponent(`\n\n-------------------\nOriginal Message:\n${selectedMessage?.message}`)}`}>
                                Reply via Email
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
