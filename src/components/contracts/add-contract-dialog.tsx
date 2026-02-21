"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Loader2, FileText, User, Briefcase, Layers, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createContract } from "@/app/(dashboard)/contracts/actions"
import { Client, Project, ContractTemplate } from "@/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const contractSchema = z.object({
    title: z.string().min(2, "Title is required"),
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters"),
})

type ContractFormValues = z.infer<typeof contractSchema>

interface AddContractDialogProps {
    clients: Client[];
    projects: Project[];
    templates?: ContractTemplate[];
}

export function AddContractDialog({ clients, projects, templates = [] }: AddContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
    })

    // Filter projects based on selected client
    const selectedClientId = watch("clientId");
    const filteredProjects = selectedClientId
        ? projects.filter(p => p.client_id === selectedClientId)
        : [];

    function handleTemplateSelect(templateId: string) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setValue("content", template.content, { shouldValidate: true });
        }
    }

    async function onSubmit(data: ContractFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("title", data.title)
            formData.append("clientId", data.clientId)
            if (data.projectId) formData.append("projectId", data.projectId)
            formData.append("content", data.content)

            await createContract(formData)
            setOpen(false)
            reset()
        } catch (error) {
            console.error(error)
            alert("Failed to create contract")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-11 px-6 shadow-lg shadow-brand-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="h-4 w-4" /> New Contract
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">

                    {/* ── Dark Header ── */}
                    <div className="bg-slate-900 text-white px-6 pt-6 pb-5 shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Plus className="h-16 w-16" />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-9 w-9 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-brand-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-tight">Create New Contract</h2>
                                <p className="text-slate-400 text-xs mt-0.5">Start a fresh agreement from scratch or a template.</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <Label htmlFor="add-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Title</Label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                <Input
                                    id="add-title"
                                    placeholder="e.g. Graphic Design Consultancy"
                                    className="h-11 pl-11 border-slate-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary font-medium rounded-xl"
                                    {...register("title")}
                                />
                            </div>
                            {errors.title && (
                                <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Associations Section */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client</Label>
                                <Select
                                    value={selectedClientId}
                                    onValueChange={(v) => setValue("clientId", v)}
                                >
                                    <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                                        <SelectValue placeholder="Select client..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.clientId && (
                                    <p className="text-xs text-red-500 font-medium">{errors.clientId.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project (Optional)</Label>
                                <Select
                                    value={watch("projectId")}
                                    onValueChange={(v) => setValue("projectId", v)}
                                    disabled={!selectedClientId}
                                >
                                    <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                                        <SelectValue placeholder="Select project..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredProjects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Template Quick Selection */}
                        {templates.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Templates</Label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {templates.slice(0, 4).map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleTemplateSelect(t.id)}
                                            className="px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-brand-primary/5 hover:border-brand-primary transition-all cursor-pointer flex items-center gap-2 group"
                                        >
                                            <Layers className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-primary" />
                                            <span className="text-[11px] font-bold text-slate-600 truncate">{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium pl-1 italic">Selecting a template will overwrite the terms below.</p>
                            </div>
                        )}

                        {/* Content Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="add-content" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Terms</Label>
                                <Badge variant="outline" className="text-[10px] font-bold text-slate-400">MARKDOWN SUPPORT</Badge>
                            </div>
                            <textarea
                                id="add-content"
                                className="flex min-h-[250px] w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-serif leading-relaxed focus-visible:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all"
                                placeholder="Enter contract terms here..."
                                {...register("content")}
                            />
                            {errors.content && (
                                <p className="text-xs text-red-500 font-medium">{errors.content.message}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 mt-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-slate-500 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold gap-2 min-w-[140px] rounded-xl shadow-lg shadow-brand-primary/10"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Draft
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
