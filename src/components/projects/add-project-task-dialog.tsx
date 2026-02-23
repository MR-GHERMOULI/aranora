"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createTask } from "@/app/(dashboard)/tasks/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Plus, User, Check, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useEffect } from "react"
import { getProjectMembers } from "@/app/(dashboard)/projects/collaborator-actions"
import { Badge } from "@/components/ui/badge"

interface Member {
    id: string;
    full_name: string | null;
    company_email: string | null;
    member_type?: 'owner' | 'team' | 'partner';
}

interface AddProjectTaskDialogProps {
    projectId: string
}

export function AddProjectTaskDialog({ projectId }: AddProjectTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("Medium")
    const [status, setStatus] = useState("Todo")
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
    const [estimatedHours, setEstimatedHours] = useState("")
    const [members, setMembers] = useState<Member[]>([])
    const [assignedTo, setAssignedTo] = useState<string>("")
    const [visibleTo, setVisibleTo] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            getProjectMembers(projectId).then(setMembers)
        }
    }, [open, projectId])

    const toggleVisibility = (memberId: string) => {
        setVisibleTo(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Task title is required")
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("title", title.trim())
            formData.append("description", description.trim())
            formData.append("priority", priority)
            formData.append("status", status)
            formData.append("projectId", projectId)
            if (assignedTo) {
                formData.append("assignedTo", assignedTo)
            }
            if (visibleTo.length > 0) {
                formData.append("visibleTo", visibleTo.join(','))
            }
            if (dueDate) {
                formData.append("dueDate", format(dueDate, "yyyy-MM-dd"))
            }
            if (estimatedHours) {
                formData.append("estimatedHours", estimatedHours)
            }

            const result = await createTask(formData, pathname)

            if (result?.error) {
                toast.error("Failed to create task")
            } else {
                toast.success("Task created successfully")
                setOpen(false)
                resetForm()
                router.refresh()
            }
        } catch (error) {
            console.error("Error creating task:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setPriority("Medium")
        setStatus("Todo")
        setDueDate(undefined)
        setEstimatedHours("")
        setAssignedTo("")
        setVisibleTo([])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                        Create a new task for this project. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="assignedTo" className="text-sm font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" /> Assign To
                            </label>
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger id="assignedTo" className="bg-muted/30 border-muted-foreground/20">
                                    <SelectValue placeholder="Assignee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{member.full_name || member.company_email || "Unknown"}</span>
                                                </div>
                                                {member.member_type && (
                                                    <Badge variant={member.member_type === 'owner' ? 'default' : member.member_type === 'team' ? 'secondary' : 'outline'} className="text-[10px] h-4 px-1 py-0 uppercase">
                                                        {member.member_type}
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" /> Visible To
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-xs h-10 bg-muted/30 border-muted-foreground/20">
                                        {visibleTo.length === 0 ? "Only Assigned members" : `${visibleTo.length} members selected`}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <div className="p-2 space-y-1">
                                        <p className="text-[10px] text-muted-foreground px-2 pb-2 border-b">Select who can see this task</p>
                                        {members.map((member) => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => toggleVisibility(member.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs hover:bg-muted transition-colors gap-2",
                                                    visibleTo.includes(member.id) && "bg-brand-primary/10 text-brand-primary"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="truncate">{member.full_name || member.company_email}</span>
                                                    {member.member_type && (
                                                        <Badge variant={member.member_type === 'owner' ? 'default' : member.member_type === 'team' ? 'secondary' : 'outline'} className="text-[9px] h-3.5 px-1 py-0 uppercase shrink-0">
                                                            {member.member_type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {visibleTo.includes(member.id) && <Check className="h-3 w-3 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title
                        </label>
                        <Input
                            id="title"
                            placeholder="e.g., Review design documents"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            placeholder="Add details about this task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todo">Todo</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Due Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="estimatedHours" className="text-sm font-medium">
                            Estimated Hours
                        </label>
                        <Input
                            id="estimatedHours"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 5.5"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Task"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
