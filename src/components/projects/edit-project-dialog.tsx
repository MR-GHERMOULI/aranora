"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Pencil, Loader2, CalendarIcon } from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { toast } from "sonner"

const projectSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    status: z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]),
    budget: z.string().optional(),
    description: z.string().optional().or(z.literal("")),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    hourlyRate: z.string().optional(),
    collaboratorEmails: z.array(z.string()),
});

type ProjectFormValues = z.infer<typeof projectSchema>

interface EditProjectDialogProps {
    project: Project
}

import { getCollaborators } from "@/app/(dashboard)/collaborators/actions"
import { getProjectCollaborators } from "@/app/(dashboard)/projects/collaborator-actions"
import { CollaboratorCRM } from "@/types"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export function EditProjectDialog({ project }: EditProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [crmCollaborators, setCRMCollaborators] = useState<CollaboratorCRM[]>([])

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: project.title,
            status: (['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].includes(project.status)
                ? project.status
                : "Planning") as any,
            budget: project.budget?.toString() || "",
            description: project.description || "",
            startDate: project.start_date ? new Date(project.start_date) : undefined,
            endDate: project.end_date ? new Date(project.end_date) : undefined,
            hourlyRate: project.hourly_rate?.toString() || "",
            collaboratorEmails: [],
        },
    })

    const selectedEmails = watch("collaboratorEmails") || []

    useEffect(() => {
        if (open) {
            getCollaborators().then(setCRMCollaborators)
            getProjectCollaborators(project.id).then(colls => {
                const emails = colls.map(c => c.collaborator_email)
                setValue("collaboratorEmails", emails)
            })
        }
    }, [open, project.id, setValue])

    async function onSubmit(data: ProjectFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", project.id)
            formData.append("title", data.title)
            formData.append("status", data.status)
            if (data.budget) formData.append("budget", data.budget)
            if (data.description) formData.append("description", data.description)
            if (data.startDate) formData.append("startDate", format(data.startDate, "yyyy-MM-dd"))
            if (data.endDate) formData.append("endDate", format(data.endDate, "yyyy-MM-dd"))
            if (data.hourlyRate) formData.append("hourlyRate", data.hourlyRate)
            formData.append("collaboratorEmails", JSON.stringify(data.collaboratorEmails))

            await updateProject(formData)
            toast.success("Project updated successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update project")
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
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Planning">Planning</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="On Hold">On Hold</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
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
                                <Label htmlFor="hourlyRate">Default Hourly Rate ($)</Label>
                                <Input
                                    id="hourlyRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="100.00"
                                    {...register("hourlyRate")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>End Date</Label>
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Collaborators (Optional)</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedEmails.map(email => {
                                    const coll = crmCollaborators.find(c => c.email === email);
                                    return (
                                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                                            {coll?.full_name || email}
                                            <X
                                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                onClick={() => setValue("collaboratorEmails", selectedEmails.filter(e => e !== email))}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                            <Select onValueChange={(email) => {
                                if (email && !selectedEmails.includes(email)) {
                                    setValue("collaboratorEmails", [...selectedEmails, email]);
                                }
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Add collaborator from directory..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {crmCollaborators.filter(c => c.email && !selectedEmails.includes(c.email)).map(c => (
                                        <SelectItem key={c.id} value={c.email!}>
                                            {c.full_name} ({c.email})
                                        </SelectItem>
                                    ))}
                                    {crmCollaborators.length === 0 && (
                                        <div className="p-2 text-xs text-muted-foreground text-center">
                                            No collaborators found in directory.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
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
