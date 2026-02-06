"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Clock, MoreHorizontal, Pencil, Trash2, AlertCircle } from "lucide-react"
import { format, isPast, isToday, addDays, isBefore } from "date-fns"
import { Task, updateTaskStatus, deleteTask } from "@/app/(dashboard)/calendar/actions"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { EditTaskDialog } from "./edit-task-dialog"
import { Project } from "@/types"

interface TaskItemProps {
    task: Task
    projects: Project[]
}

export function TaskItem({ task, projects }: TaskItemProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'Done'
    const isDueSoon = task.due_date && !isPast(new Date(task.due_date)) && isBefore(new Date(task.due_date), addDays(new Date(), 2)) && task.status !== 'Done'

    const handleStatusToggle = async () => {
        setIsUpdating(true)
        try {
            const nextStatus = task.status === 'Todo' ? 'In Progress' : task.status === 'In Progress' ? 'Done' : 'Todo'
            await updateTaskStatus(task.id, nextStatus)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task?")) return
        try {
            await deleteTask(task.id)
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${isOverdue ? 'border-red-300 bg-red-50/50' : isDueSoon ? 'border-yellow-300 bg-yellow-50/50' : ''}`}>
            <button
                onClick={handleStatusToggle}
                disabled={isUpdating}
                className="mt-1 focus:outline-none"
            >
                {task.status === 'Done' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : task.status === 'In Progress' ? (
                    <Clock className="h-5 w-5 text-blue-500" />
                ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
            </button>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <p className={`font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                        {task.due_date && (
                            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-100 text-red-700' : isDueSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                {isOverdue && <AlertCircle className="h-3 w-3" />}
                                {format(new Date(task.due_date), 'MMM d')}
                            </span>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditTaskDialog task={task} projects={projects}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                </EditTaskDialog>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {task.project && (
                    <p className="text-xs text-brand-primary mt-1">{task.project.title}</p>
                )}
                {task.description && (
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                )}
            </div>
        </div>
    )
}
