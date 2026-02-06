"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Loader2 } from "lucide-react"

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
import { createProject } from "@/app/(dashboard)/projects/actions"
import { Client } from "@/types"

const projectSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    title: z.string().min(2, "Title must be at least 2 characters"),
    status: z.enum(["Pending", "In Progress", "Completed"]),
    budget: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface AddProjectDialogProps {
    clients: Client[];
}

export function AddProjectDialog({ clients }: AddProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            status: "Pending",
        },
    })

    async function onSubmit(data: ProjectFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("clientId", data.clientId)
            formData.append("title", data.title)
            formData.append("status", data.status)
            if (data.budget) formData.append("budget", data.budget)
            if (data.description) formData.append("description", data.description)
            if (data.startDate) formData.append("startDate", data.startDate)
            if (data.endDate) formData.append("endDate", data.endDate)

            await createProject(formData)
            setOpen(false)
            reset()
        } catch (error) {
            console.error(error)
            alert("Failed to create project")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Start a new project for a client.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">

                        <div className="grid gap-2">
                            <Label htmlFor="clientId">Client</Label>
                            <select
                                id="clientId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register("clientId")}
                            >
                                <option value="">Select a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            {errors.clientId && (
                                <p className="text-sm text-red-500">{errors.clientId.message}</p>
                            )}
                        </div>

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
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
