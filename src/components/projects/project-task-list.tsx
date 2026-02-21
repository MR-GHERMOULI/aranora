"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createTask, updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Loader2, Trash2, Circle, CheckCircle2, Calendar, LayoutList } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { AddProjectTaskDialog } from "./add-project-task-dialog"
import { TaskTimerButton } from "@/components/time-tracking/task-timer-button"

interface Task {
    id: string
    title: string
    description?: string
    status: string
    priority?: string
    due_date?: string
    project_id?: string
    created_at: string
}

interface ProjectTaskListProps {
    tasks: Task[]
    projectId: string
}

export function ProjectTaskList({ tasks, projectId }: ProjectTaskListProps) {
    const [newTitle, setNewTitle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    const completedCount = tasks.filter(t => t.status === "Done").length
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

    // Remove the old handleAddTask as we now use the dialog

    const handleToggle = async (task: Task) => {
        setTogglingId(task.id)
        try {
            const newStatus = task.status === "Done" ? "Todo" : "Done"
            const result = await updateTask(task.id, { status: newStatus }, pathname)
            if (result?.error) {
                toast.error("Failed to update task")
            } else {
                router.refresh()
            }
        } catch {
            toast.error("Failed to update task")
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async (taskId: string) => {
        setDeletingId(taskId)
        try {
            const result = await deleteTask(taskId, pathname)
            if (result?.error) {
                toast.error("Failed to delete task")
            } else {
                toast.success("Task deleted")
                router.refresh()
            }
        } catch {
            toast.error("Failed to delete task")
        } finally {
            setDeletingId(null)
        }
    }

    const priorityColors: Record<string, string> = {
        High: "bg-red-100 text-red-700",
        Medium: "bg-yellow-100 text-yellow-700",
        Low: "bg-green-100 text-green-700",
    }

    const todoTasks = tasks.filter(t => t.status !== "Done")
    const doneTasks = tasks.filter(t => t.status === "Done")

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" /> Project Tasks
                    </CardTitle>
                    <CardDescription>
                        {completedCount} of {tasks.length} tasks completed
                    </CardDescription>
                </div>
                <AddProjectTaskDialog projectId={projectId} />
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Bar */}
                {tasks.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                    </div>
                )}


                {/* Task List */}
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No tasks yet. Click "Add Task" to get started.
                    </div>
                ) : (
                    <>
                        {/* Active Tasks */}
                        <div className="space-y-3">
                            {todoTasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors group">
                                    <button
                                        onClick={() => handleToggle(task)}
                                        disabled={togglingId === task.id}
                                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                    >
                                        {togglingId === task.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Circle className="h-5 w-5 group-hover:text-green-500 transition-colors" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium leading-none">{task.title}</p>
                                            {task.priority && (
                                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority] || ''}`}>
                                                    {task.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 pt-1">
                                            {task.due_date && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(task.due_date), 'MMM d')}
                                                </span>
                                            )}
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                {task.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 -mr-2">
                                        <TaskTimerButton
                                            taskId={task.id}
                                            taskTitle={task.title}
                                            projectId={projectId}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(task.id)}
                                            disabled={deletingId === task.id}
                                        >
                                            {deletingId === task.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Done Tasks */}
                        {doneTasks.length > 0 && (
                            <>
                                <div className="text-xs font-medium text-muted-foreground pt-2">
                                    Completed ({doneTasks.length})
                                </div>
                                {doneTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:bg-muted/30 transition-colors group opacity-75">
                                        <button
                                            onClick={() => handleToggle(task)}
                                            disabled={togglingId === task.id}
                                            className="text-green-600 shrink-0"
                                        >
                                            {togglingId === task.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-5 w-5 fill-current" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate line-through text-muted-foreground">{task.title}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(task.id)}
                                            disabled={deletingId === task.id}
                                        >
                                            {deletingId === task.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
