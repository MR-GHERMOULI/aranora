"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTask, updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Plus, Loader2, Trash2, Circle, CheckCircle2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()

    const handleAddTask = async () => {
        if (!newTitle.trim()) return
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("title", newTitle.trim())
            formData.append("status", "Todo")
            formData.append("projectId", projectId)
            formData.append("priority", "Medium")

            const result = await createTask(formData)
            if (result?.error) {
                toast.error("Failed to create task")
            } else {
                toast.success("Task created")
                setNewTitle("")
                setIsAdding(false)
                router.refresh()
            }
        } catch {
            toast.error("Failed to create task")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (task: Task) => {
        setTogglingId(task.id)
        try {
            const newStatus = task.status === "Done" ? "Todo" : "Done"
            const result = await updateTask(task.id, { status: newStatus })
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
            const result = await deleteTask(taskId)
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
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {doneTasks.length} completed
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Add Task Form */}
                {isAdding && (
                    <div className="flex gap-2 pb-3 border-b">
                        <Input
                            placeholder="Task title..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddTask() }}
                            autoFocus
                        />
                        <Button size="sm" onClick={handleAddTask} disabled={isSubmitting || !newTitle.trim()}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewTitle("") }}>
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Task List */}
                {tasks.length === 0 && !isAdding ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No tasks yet. Click "Add Task" to get started.
                    </div>
                ) : (
                    <>
                        {/* Active Tasks */}
                        {todoTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                                <button
                                    onClick={() => handleToggle(task)}
                                    disabled={togglingId === task.id}
                                    className="text-muted-foreground hover:text-brand-primary transition-colors shrink-0"
                                >
                                    {togglingId === task.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Circle className="h-5 w-5" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {task.priority && (
                                            <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority] || ''}`}>
                                                {task.priority}
                                            </Badge>
                                        )}
                                        {task.due_date && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(task.due_date), 'MMM d')}
                                            </span>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {task.status}
                                        </Badge>
                                    </div>
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

                        {/* Done Tasks */}
                        {doneTasks.length > 0 && (
                            <>
                                <div className="text-xs font-medium text-muted-foreground pt-2">
                                    Completed ({doneTasks.length})
                                </div>
                                {doneTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-dashed opacity-60 hover:opacity-100 transition-opacity group">
                                        <button
                                            onClick={() => handleToggle(task)}
                                            disabled={togglingId === task.id}
                                            className="text-green-600 shrink-0"
                                        >
                                            {togglingId === task.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-5 w-5" />
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
