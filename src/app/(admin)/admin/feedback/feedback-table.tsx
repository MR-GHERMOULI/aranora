"use client"

import { useState } from "react"
import { Search, Filter, Trash2, CheckCircle, Clock, Eye, ExternalLink, MessageSquare, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { markFeedbackAsRead, deleteFeedback } from "@/app/actions/feedback"
import type { CustomerFeedback } from "@/types"

interface FeedbackTableProps {
    initialFeedback: CustomerFeedback[]
}

export function FeedbackTable({ initialFeedback }: FeedbackTableProps) {
    const [feedback, setFeedback] = useState<CustomerFeedback[]>(initialFeedback)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedItem, setSelectedItem] = useState<CustomerFeedback | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const filteredFeedback = feedback.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.project?.title.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            statusFilter === "all" ? true :
                statusFilter === "unread" ? !item.is_read :
                    statusFilter === "read" ? item.is_read : true

        return matchesSearch && matchesStatus
    })

    async function handleMarkAsRead(id: string) {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f))
        const res = await markFeedbackAsRead(id)
        if (res.error) {
            toast.error(res.error)
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_read: false } : f))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this feedback?")) return
        setIsLoading(true)
        const res = await deleteFeedback(id)
        if (res.success) {
            setFeedback(prev => prev.filter(f => f.id !== id))
            setIsDetailsOpen(false)
            toast.success("Feedback deleted")
        } else {
            toast.error(res.error || "Failed to delete")
        }
        setIsLoading(false)
    }

    function viewDetails(item: CustomerFeedback) {
        setSelectedItem(item)
        setIsDetailsOpen(true)
        if (!item.is_read) {
            handleMarkAsRead(item.id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-card border-slate-200 dark:border-slate-800"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 gap-2 bg-card">
                            <Filter className="h-4 w-4" />
                            Status: {statusFilter === "all" ? "All" : statusFilter === "read" ? "Read" : "Unread"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Feedback</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("unread")}>Unread Only</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("read")}>Read Only</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid gap-4">
                {filteredFeedback.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-card/50 p-20 text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No feedback found</h3>
                        <p className="text-slate-500 mt-1">Customer comments will appear here once they are submitted.</p>
                    </div>
                ) : (
                    filteredFeedback.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => viewDetails(item)}
                            className={`group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl hover:scale-[1.01] ${
                                item.is_read 
                                ? "bg-card border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100" 
                                : "bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-200 dark:border-blue-900 shadow-md"
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.is_read ? "bg-slate-300" : "bg-blue-500 animate-pulse"}`} />
                                    <h4 className="font-black text-lg text-slate-900 dark:text-white truncate">
                                        {item.name}
                                    </h4>
                                    {item.project && (
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">
                                            {item.project.title}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {item.comment}
                                </p>
                                <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    {item.photos?.length > 0 && (
                                        <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400">
                                            <Camera className="h-3 w-3" />
                                            {item.photos.length} Photos
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all md:ml-auto">
                                <Button variant="secondary" size="sm" className="rounded-full gap-2">
                                    <Eye className="h-4 w-4" /> View
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(item.id)
                                    }}
                                    className="rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-black tracking-tight">Customer Feedback</DialogTitle>
                            <span className="text-xs font-bold text-slate-400">
                                {selectedItem && new Date(selectedItem.created_at).toLocaleString()}
                            </span>
                        </div>
                        <DialogDescription className="flex flex-col gap-1">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">From: {selectedItem?.name}</span>
                            {selectedItem?.project && (
                                <span className="text-sm font-medium text-slate-500">Project: {selectedItem.project.title}</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-8">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {selectedItem?.comment}
                            </p>
                        </div>

                        {selectedItem?.photos && selectedItem.photos.length > 0 && (
                            <div className="space-y-4">
                                <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Attached Photos ({selectedItem.photos.length})</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedItem.photos.map((photo, i) => (
                                        <div key={i} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <img src={photo} alt={`Feedback ${i}`} className="w-full h-full object-cover" />
                                            <a 
                                                href={photo} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ExternalLink className="h-6 w-6 text-white" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant="ghost"
                            onClick={() => selectedItem && handleDelete(selectedItem.id)}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl px-6"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanent
                        </Button>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="rounded-xl px-8">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
