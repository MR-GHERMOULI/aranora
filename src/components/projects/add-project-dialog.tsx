"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Loader2, CalendarIcon, Layout, DollarSign, Briefcase, Users, FileText, ChevronRight } from "lucide-react"

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
    clientId: z.string().min(1, "Client is required"),
    title: z.string().min(2, "Title must be at least 2 characters"),
    status: z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]),
    budget: z.string().optional(),
    description: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    hourlyRate: z.string().optional(),
    collaboratorEmails: z.array(z.string()),
});

type ProjectFormValues = z.infer<typeof projectSchema>

interface AddProjectDialogProps {
    clients: Client[];
}

import { getCollaborators } from "@/app/(dashboard)/collaborators/actions"
import { CollaboratorCRM } from "@/types"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export function AddProjectDialog({ clients }: AddProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [crmCollaborators, setCRMCollaborators] = useState<CollaboratorCRM[]>([])

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            status: "Planning",
            collaboratorEmails: [],
        },
    })

    const selectedEmails = watch("collaboratorEmails") || []

    useEffect(() => {
        if (open) {
            getCollaborators().then(setCRMCollaborators)
        }
    }, [open])

    async function onSubmit(data: ProjectFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("clientId", data.clientId)
            formData.append("title", data.title)
            formData.append("status", data.status)
            if (data.budget) formData.append("budget", data.budget)
            if (data.description) formData.append("description", data.description)
            if (data.startDate) formData.append("startDate", format(data.startDate, "yyyy-MM-dd"))
            if (data.endDate) formData.append("endDate", format(data.endDate, "yyyy-MM-dd"))
            if (data.hourlyRate) formData.append("hourlyRate", data.hourlyRate)
            formData.append("collaboratorEmails", JSON.stringify(data.collaboratorEmails))

            await createProject(formData)
            toast.success("Project created successfully")
            setOpen(false)
            reset()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create project")
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
            <DialogContent className="sm:max-w-[650px] w-full p-0 overflow-hidden border-none shadow-2xl gap-0 max-h-[95dvh] flex flex-col">
                <div className="flex flex-col min-h-0 flex-1 bg-white dark:bg-slate-950">
                    {/* Branded Header */}
                    <div className="bg-slate-900 text-white px-8 pt-8 pb-6 shrink-0 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />

                        <div className="relative z-10 flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center ring-1 ring-white/10">
                                    <Briefcase className="h-7 w-7 text-indigo-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-white mb-1">Create New Project</DialogTitle>
                                    <DialogDescription className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                                        Start a new project for a client
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-slate-50/30 dark:bg-slate-900/30">
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Project Core</h3>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="clientId" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Client</Label>
                                    <div className="relative group">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Controller
                                            name="clientId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger className="h-13 pl-12 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-500/20">
                                                        <SelectValue placeholder="Select a client..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clients.map(client => (
                                                            <SelectItem key={client.id} value={client.id}>
                                                                {client.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    {errors.clientId && (
                                        <p className="text-sm text-red-500 font-medium ml-1">{errors.clientId.message}</p>
                                    )}
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="title" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Project Title</Label>
                                    <div className="relative group">
                                        <Layout className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            id="title"
                                            placeholder="e.g. Website Redesign & SEO"
                                            {...register("title")}
                                            className="h-13 pl-12 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-500/20"
                                        />
                                    </div>
                                    {errors.title && (
                                        <p className="text-sm text-red-500 font-medium ml-1">{errors.title.message}</p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-6 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Financials & Status</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="status" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Status</Label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger className="h-12 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl">
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
                                    <div className="grid gap-3">
                                        <Label htmlFor="budget" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Budget ($)</Label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                id="budget"
                                                type="number"
                                                placeholder="5000"
                                                {...register("budget")}
                                                className="h-12 pl-12 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="hourlyRate" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Hourly Rate ($)</Label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                id="hourlyRate"
                                                type="number"
                                                step="0.01"
                                                placeholder="100.00"
                                                {...register("hourlyRate")}
                                                className="h-12 pl-10 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-1 bg-violet-500 rounded-full" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Timeline</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Start Date</Label>
                                        <Controller
                                            name="startDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 justify-start text-left font-medium bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl",
                                                                !field.value && "text-slate-400"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
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
                                    <div className="grid gap-3">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">End Date</Label>
                                        <Controller
                                            name="endDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 justify-start text-left font-medium bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl",
                                                                !field.value && "text-slate-400"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
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
                            </section>

                            <section className="space-y-6 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Collaboration & Details</h3>
                                </div>

                                <div className="grid gap-3">
                                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Collaborators</Label>
                                    <div className="space-y-3">
                                        {selectedEmails.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                                {selectedEmails.map(email => {
                                                    const coll = crmCollaborators.find(c => c.email === email);
                                                    return (
                                                        <Badge key={email} variant="secondary" className="bg-white dark:bg-slate-800 px-3 py-1.5 flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{coll?.full_name || email}</span>
                                                            <X
                                                                className="h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500 transition-colors"
                                                                onClick={() => setValue("collaboratorEmails", selectedEmails.filter(e => e !== email))}
                                                            />
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <Select onValueChange={(email) => {
                                            if (email && !selectedEmails.includes(email)) {
                                                setValue("collaboratorEmails", [...selectedEmails, email]);
                                            }
                                        }}>
                                            <SelectTrigger className="h-12 bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 rounded-xl">
                                                <SelectValue placeholder="Add collaborator from directory..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {crmCollaborators.filter(c => c.email && !selectedEmails.includes(c.email)).map(c => (
                                                    <SelectItem key={c.id} value={c.email!}>
                                                        <div className="flex flex-col">
                                                            <p className="font-bold">{c.full_name}</p>
                                                            <p className="text-[10px] text-slate-400">{c.email}</p>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {crmCollaborators.length === 0 && (
                                                    <div className="p-4 text-xs text-muted-foreground text-center italic">
                                                        No collaborators found in directory.
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="description" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Project Description</Label>
                                    <textarea
                                        id="description"
                                        className="flex min-h-[100px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus-visible:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white placeholder:text-slate-400"
                                        placeholder="Describe the scope and deliverables..."
                                        {...register("description")}
                                    />
                                </div>
                            </section>
                        </div>

                        <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
                            <Button variant="ghost" onClick={() => setOpen(false)} type="button">Cancel</Button>
                            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-indigo-600/20 gap-2">
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create Project
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
