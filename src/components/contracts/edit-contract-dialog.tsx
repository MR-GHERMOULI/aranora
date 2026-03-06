"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Pencil, Loader2, FileText, User, Briefcase, Layers, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, Undo2, Redo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { updateContract } from "@/app/(dashboard)/contracts/actions"
import { Contract, Client, Project } from "@/types"
import { useRouter } from "next/navigation"
import { useRef, useCallback } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

const contractSchema = z.object({
    title: z.string().min(2, "Title is required"),
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters"),
})

type ContractFormValues = z.infer<typeof contractSchema>

interface EditContractDialogProps {
    contract: Contract;
    clients: Client[];
    projects: Project[];
}

export function EditContractDialog({ contract, clients, projects }: EditContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const editorRef = useRef<HTMLDivElement>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            title: contract.title,
            clientId: contract.client_id,
            projectId: contract.project_id || "",
            content: contract.content || "",
        }
    })

    const selectedClientId = watch("clientId");
    const filteredProjects = selectedClientId
        ? projects.filter(p => p.client_id === selectedClientId)
        : [];

    async function onSubmit(data: ContractFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", contract.id)
            formData.append("title", data.title)
            formData.append("clientId", data.clientId)
            if (data.projectId) formData.append("projectId", data.projectId)
            formData.append("content", editorRef.current?.innerHTML || data.content)

            await updateContract(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update contract")
        } finally {
            setLoading(false)
        }
    }

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-9 px-4 border-slate-200 hover:bg-slate-50 gap-2 font-semibold">
                    <Pencil className="h-4 w-4 text-slate-400" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">

                    {/* ── Dark Header ── */}
                    <div className="bg-slate-900 text-white px-6 pt-6 pb-5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                                <Pencil className="h-5 w-5 text-brand-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-tight">Edit Contract</h2>
                                <p className="text-slate-400 text-xs mt-0.5">Modify contract details, participants and terms.</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Title</Label>
                            <Input
                                id="edit-title"
                                placeholder="Service Agreement - Q1"
                                className="h-11 border-slate-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary font-medium rounded-xl"
                                {...register("title")}
                            />
                            {errors.title && (
                                <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Participants Section */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Association</Label>
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
                                        <SelectItem value="none">No Project</SelectItem>
                                        {filteredProjects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Content Section - Rich Text Editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Terms</Label>
                                <Badge variant="outline" className="text-[10px] font-bold text-slate-400">RICH TEXT</Badge>
                            </div>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                {/* Mini Toolbar */}
                                <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
                                    {[
                                        { icon: Bold, cmd: 'bold', label: 'Bold' },
                                        { icon: Italic, cmd: 'italic', label: 'Italic' },
                                        { icon: UnderlineIcon, cmd: 'underline', label: 'Underline' },
                                        null,
                                        { icon: Heading1, cmd: 'formatBlock', val: 'h1', label: 'H1' },
                                        { icon: Heading2, cmd: 'formatBlock', val: 'h2', label: 'H2' },
                                        null,
                                        { icon: List, cmd: 'insertUnorderedList', label: 'Bullets' },
                                        { icon: ListOrdered, cmd: 'insertOrderedList', label: 'Numbers' },
                                        null,
                                        { icon: Undo2, cmd: 'undo', label: 'Undo' },
                                        { icon: Redo2, cmd: 'redo', label: 'Redo' },
                                    ].map((btn, i) => {
                                        if (!btn) return <div key={i} className="w-px h-5 bg-slate-200 mx-0.5" />
                                        const Icon = btn.icon
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => execCommand(btn.cmd, btn.val)}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
                                                title={btn.label}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </button>
                                        )
                                    })}
                                </div>
                                {/* Editor */}
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    dangerouslySetInnerHTML={{ __html: contract.content || '' }}
                                    className="min-h-[280px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm font-serif leading-relaxed text-slate-800 focus:outline-none prose prose-slate prose-headings:font-serif max-w-none selection:bg-brand-primary/20"
                                />
                            </div>
                            {errors.content && (
                                <p className="text-xs text-red-500 font-medium">{errors.content.message}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
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
                            Update Contract
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
