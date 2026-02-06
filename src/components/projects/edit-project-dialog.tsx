"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Pencil, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProject } from "@/app/(dashboard)/projects/actions"
import { Project } from "@/types"
import { useRouter } from "next/navigation"

const projectSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    status: z.enum(["Pending", "In Progress", "Completed"]),
    budget: z.string().optional(),
    description: z.string().optional().or(z.literal("")),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface EditProjectDialogProps {
    project: Project
}

export function EditProjectDialog({ project }: EditProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: project.title,
            status: project.status,
            budget: project.budget?.toString() || "",
            description: project.description || "",
            startDate: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
            endDate: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : "",
        },
    })

    async function onSubmit(data: ProjectFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", project.id)
            formData.append("title", data.title)
            formData.append("status", data.status)
            if (data.budget) formData.append("budget", data.budget)
            if (data.description) formData.append("description", data.description)
            if (data.startDate) formData.append("startDate", data.startDate)
            if (data.endDate) formData.append("endDate", data.endDate)

            await updateProject(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update project")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update the project details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                placeholder="Website Redesign"
                                {...register("title")}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("status")}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="5000"
                                    {...register("budget")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    {...register("startDate")}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    {...register("endDate")}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Project details..."
                                {...register("description")}
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
