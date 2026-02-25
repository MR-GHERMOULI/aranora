"use client"

import { useState } from "react"
import { Radio, Users, CheckCircle, AlertCircle, Info, Send } from "lucide-react"
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
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        type: "info",
    })
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

            <div className="rounded-xl border bg-card">
                <div className="p-4 border-b bg-muted/30">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1">Type</div>
                        <div className="col-span-5">Subject</div>
                        <div className="col-span-2">Audience</div>
                        <div className="col-span-2">Sent</div>
                        <div className="col-span-2 text-right">Date</div>
                    </div>
                </div>
                <div className="divide-y">
                    {broadcasts.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No broadcasts sent yet
                        </div>
                    ) : (
                        broadcasts.map((b) => (
                            <div key={b.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/10 transition-colors">
                                <div className="col-span-1 flex justify-center">
                                    {getTypeIcon(b.type)}
                                </div>
                                <div className="col-span-5 font-medium truncate">
                                    {b.subject}
                                </div>
                                <div className="col-span-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {b.target_audience === 'all' ? 'All Users' : b.target_audience}
                                    </Badge>
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {b.sent_count}
                                </div>
                                <div className="col-span-2 text-right text-sm text-muted-foreground">
                                    {new Date(b.created_at).toLocaleDateString('en-US')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
