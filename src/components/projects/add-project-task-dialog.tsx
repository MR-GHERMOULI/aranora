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
import { Calendar as CalendarIcon, Loader2, Plus, User, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useEffect } from "react"
import { getProjectMembers } from "@/app/(dashboard)/projects/collaborator-actions"

interface Member {
    id: string;
    full_name: string | null;
    company_email: string | null;
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

    useEffect(() => {
        if (open) {
            getProjectMembers(projectId).then(setMembers)
        }
    }, [open, projectId])

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
                    <div className="grid gap-2">
                        <label htmlFor="assignedTo" className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" /> Assign To
                        </label>
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger id="assignedTo" className="bg-muted/30 border-muted-foreground/20">
                                <SelectValue placeholder="Assign to project member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id} className="cursor-pointer">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.full_name || "Unknown Member"}</span>
                                            <span className="text-xs text-muted-foreground">{member.company_email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {members.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                        Only you can be assigned (Invite collaborators first)
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
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
