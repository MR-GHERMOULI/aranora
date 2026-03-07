"use client"

import { useState } from "react"
import { Radio, Users, CheckCircle, AlertCircle, Info, Send, MoreHorizontal, Edit, Trash2, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Broadcast {
    id: string
    subject: string
    message: string
    type: string
    target_audience: string
    sent_count: number
    created_at: string
}

interface BroadcastsTableProps {
    initialBroadcasts: Broadcast[]
}

export function BroadcastsClient({ initialBroadcasts }: BroadcastsTableProps) {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)

    // State for creating a new broadcast
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        type: "info",
    })

    // State for editing a broadcast
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editData, setEditData] = useState<Broadcast | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // State for deleting
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [broadcastToDelete, setBroadcastToDelete] = useState<Broadcast | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const router = useRouter()

    async function handleSend() {
        if (!formData.subject || !formData.message) {
            toast.error("Please fill in all fields")
            return
        }

        setIsSending(true)
        try {
            const response = await fetch("/api/admin/broadcasts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error("Failed to send broadcast")

            toast.success("Broadcast sent successfully to all users")
            setIsDialogOpen(false)
            setFormData({ subject: "", message: "", type: "info" })
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to send broadcast")
        } finally {
            setIsSending(false)
        }
    }

    async function handleEdit() {
        if (!editData?.subject || !editData?.message) {
            toast.error("Please fill in all fields")
            return
        }

        setIsEditing(true)
        try {
            const response = await fetch(`/api/admin/broadcasts/${editData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "edit",
                    subject: editData.subject,
                    message: editData.message,
                    type: editData.type,
                }),
            })

            if (!response.ok) throw new Error("Failed to edit broadcast")

            toast.success("Broadcast updated successfully for all users")
            setIsEditDialogOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to edit broadcast")
        } finally {
            setIsEditing(false)
        }
    }

    async function handleArchive(id: string) {
        try {
            const response = await fetch(`/api/admin/broadcasts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "archive" }),
            })

            if (!response.ok) throw new Error("Failed to archive broadcast")

            toast.success("Broadcast archived. It is no longer visible here but users can still see it.")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to archive broadcast")
        }
    }

    async function handleDelete() {
        if (!broadcastToDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/admin/broadcasts/${broadcastToDelete.id}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete broadcast")

            toast.success("Broadcast deleted completely from all users")
            setIsDeleteDialogOpen(false)
            setBroadcastToDelete(null)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete broadcast")
        } finally {
            setIsDeleting(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "info": return <Info className="h-4 w-4 text-blue-500" />
            case "success": return <CheckCircle className="h-4 w-4 text-green-500" />
            case "warning": return <AlertCircle className="h-4 w-4 text-orange-500" />
            default: return <Info className="h-4 w-4" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">History</h2>
                    <p className="text-sm text-muted-foreground">Past broadcasts sent to users</p>
                </div>

                {/* Create New Broadcast Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Send className="h-4 w-4" /> New Broadcast
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Send New Broadcast</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    placeholder="e.g., System Maintenance Update"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Information</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="warning">Warning/Alert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea
                                    placeholder="Enter your message here..."
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This message will be sent to <strong>all registered users</strong>.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSend} disabled={isSending}>
                                {isSending ? "Sending..." : "Send Broadcast"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Broadcasts List */}
            <div className="rounded-xl border bg-card">
                <div className="p-4 border-b bg-muted/30">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1">Type</div>
                        <div className="col-span-4">Subject</div>
                        <div className="col-span-2">Audience</div>
                        <div className="col-span-2">Sent</div>
                        <div className="col-span-2 text-right">Date</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                </div>
                <div className="divide-y relative min-h-[100px]">
                    {initialBroadcasts.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No active broadcasts found
                        </div>
                    ) : (
                        initialBroadcasts.map((b) => (
                            <div key={b.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/10 transition-colors">
                                <div className="col-span-1 flex justify-center">
                                    {getTypeIcon(b.type)}
                                </div>
                                <div className="col-span-4 font-medium truncate" title={b.subject}>
                                    {b.subject}
                                </div>
                                <div className="col-span-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {b.target_audience === 'all' ? 'All Users' : b.target_audience}
                                    </Badge>
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3 shrink-0" />
                                    {b.sent_count}
                                </div>
                                <div className="col-span-2 text-right text-sm text-muted-foreground">
                                    {new Date(b.created_at).toLocaleDateString('en-US')}
                                </div>
                                <div className="col-span-1 text-right flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[160px]">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => {
                                                setEditData(b)
                                                setIsEditDialogOpen(true)
                                            }}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Broadcast
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleArchive(b.id)}>
                                                <Archive className="mr-2 h-4 w-4" />
                                                Archive
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => {
                                                    setBroadcastToDelete(b)
                                                    setIsDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditDialogOpen(false)
                    setTimeout(() => setEditData(null), 200)
                }
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Broadcast</DialogTitle>
                    </DialogHeader>
                    {editData && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    value={editData.subject}
                                    onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={editData.type}
                                    onValueChange={(val) => setEditData({ ...editData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Information</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="warning">Warning/Alert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea
                                    rows={5}
                                    value={editData.message}
                                    onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This will instantly update the message for all users who received it.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={isEditing}>
                            {isEditing ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsDeleteDialogOpen(false)
                    setTimeout(() => setBroadcastToDelete(null), 200)
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Broadcast?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            This will completely remove <strong>"{broadcastToDelete?.subject}"</strong> from your history and will secretly delete the notification from <strong>all users' dashboards</strong>.
                            Users will no longer be able to see this message.
                        </p>
                        <p className="text-sm font-semibold mt-4 text-destructive">
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
