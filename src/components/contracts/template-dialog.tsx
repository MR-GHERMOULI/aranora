"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Plus, Pencil, Loader2, ShieldCheck, DollarSign,
    FileText, Layers, Copy, Check, Info
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTemplate, updateTemplate } from "@/app/(dashboard)/contracts/actions"
import { ContractTemplate, ContractStructuredData } from "@/types"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

const templateSchema = z.object({
    name: z.string().min(2, "Template name is required"),
    content: z.string().min(10, "Content must be at least 10 characters"),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface TemplateDialogProps {
    template?: ContractTemplate;
    trigger?: React.ReactNode;
}

const PLACEHOLDERS = [
    { tag: "{{freelancer_name}}", desc: "Your name" },
    { tag: "{{client_name}}", desc: "Client's name" },
    { tag: "{{total_amount}}", desc: "Total budget" },
    { tag: "{{payment_type}}", desc: "Fixed / Hourly" },
    { tag: "{{start_date}}", desc: "Project start" },
    { tag: "{{end_date}}", desc: "Project end" },
    { tag: "{{deliverables}}", desc: "Deliverables list" },
    { tag: "{{governing_law}}", desc: "Jurisdiction" },
    { tag: "{{nda_status}}", desc: "NDA clause" },
    { tag: "{{ip_ownership}}", desc: "IP ownership" },
    { tag: "{{revisions_included}}", desc: "# Revisions" },
    { tag: "{{termination_notice_days}}", desc: "Notice days" },
]

function CopyableTag({ tag, desc }: { tag: string; desc: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(tag)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return (
        <button
            type="button"
            onClick={copy}
            title={desc}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-[10px] font-mono text-emerald-300 group/tag"
        >
            {tag}
            {copied
                ? <Check className="h-2.5 w-2.5 text-emerald-400" />
                : <Copy className="h-2.5 w-2.5 text-slate-500 group-hover/tag:text-emerald-400 transition-colors" />
            }
        </button>
    )
}

export function TemplateDialog({ template, trigger }: TemplateDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"content" | "defaults">("content")
    const [showPlaceholders, setShowPlaceholders] = useState(false)
    const isEdit = !!template

    const [structuredData, setStructuredData] = useState<ContractStructuredData>(template?.contract_data || {
        currency: "USD",
        total_amount: 0,
        payment_type: "Fixed",
        payment_schedule: "On Completion",
        revisions_included: 2,
        termination_notice_days: 14,
        governing_law: "the local jurisdiction",
        nda_included: true,
        ip_ownership: "Full",
        paper_size: "A4",
        tax_rate: 0,
    })

    const updateStructuredData = (updates: Partial<ContractStructuredData>) => {
        setStructuredData(prev => ({ ...prev, ...updates }))
    }

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: template ? {
            name: template.name,
            content: template.content,
        } : undefined,
    })

    async function onSubmit(data: TemplateFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            if (template) formData.append("id", template.id)
            formData.append("name", data.name)
            formData.append("content", data.content)
            formData.append("contractData", JSON.stringify(structuredData))

            if (isEdit) {
                await updateTemplate(formData)
            } else {
                await createTemplate(formData)
            }
            setOpen(false)
            if (!isEdit) {
                reset()
                setActiveTab("content")
            }
        } catch (error) {
            console.error(error)
            alert(`Failed to ${isEdit ? 'update' : 'create'} template`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold gap-2">
                        {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isEdit ? 'Edit Template' : 'New Template'}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">

                    {/* ── Dark Header ── */}
                    <div className="bg-slate-900 text-white px-6 pt-6 pb-5 shrink-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-9 w-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-violet-300" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-tight">
                                    {isEdit ? 'Edit Template' : 'Create New Template'}
                                </h2>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    {isEdit
                                        ? 'Update your reusable contract template.'
                                        : 'Build a reusable template with smart defaults.'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Tab switcher */}
                        <div className="flex gap-1 mt-5 p-1 bg-slate-800 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setActiveTab("content")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "content"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                Legal Text
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("defaults")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "defaults"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                <ShieldCheck className="h-3 w-3" />
                                Smart Defaults
                            </button>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto">

                        {/* Template Name — always visible */}
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                                Template Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Web Development Agreement"
                                className="h-11 border-slate-200 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary/50 font-medium"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>
                            )}
                        </div>

                        {/* ── Legal Text Tab ── */}
                        {activeTab === "content" && (
                            <div className="px-6 py-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="content" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Contract Terms
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPlaceholders(!showPlaceholders)}
                                        className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
                                    >
                                        <Info className="h-3 w-3" />
                                        {showPlaceholders ? 'Hide' : 'Show'} Variables
                                    </button>
                                </div>

                                {/* Placeholder guide */}
                                {showPlaceholders && (
                                    <div className="rounded-xl bg-slate-900 p-4 space-y-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                            Click a variable to copy it
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PLACEHOLDERS.map(p => (
                                                <CopyableTag key={p.tag} tag={p.tag} desc={p.desc} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <textarea
                                    id="content"
                                    className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary/40 placeholder:text-slate-400 transition-all font-mono leading-relaxed"
                                    style={{ minHeight: '280px', resize: 'vertical' }}
                                    placeholder={`FREELANCE SERVICES AGREEMENT\n\nThis agreement is entered into between {{freelancer_name}} ("Service Provider") and {{client_name}} ("Client").\n\n...\n\nTotal Compensation: {{total_amount}}\nProject Start: {{start_date}}\nDeliverables:\n{{deliverables}}`}
                                    {...register("content")}
                                />
                                {errors.content && (
                                    <p className="text-xs text-red-500">{errors.content.message}</p>
                                )}
                            </div>
                        )}

                        {/* ── Smart Defaults Tab ── */}
                        {activeTab === "defaults" && (
                            <div className="px-6 py-5 space-y-5">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    These values pre-fill the Smart Contract Assistant when this template is selected — saving you time on every new contract.
                                </p>

                                {/* Budget & Payment */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Financial Terms
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">Default Budget</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={structuredData.total_amount || ""}
                                                    onChange={(e) => updateStructuredData({ total_amount: Number(e.target.value) })}
                                                    className="h-10 border-slate-200 focus-visible:ring-brand-primary/30"
                                                />
                                                <Select value={structuredData.currency} onValueChange={(v) => updateStructuredData({ currency: v })}>
                                                    <SelectTrigger className="w-20 h-10 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="EUR">EUR</SelectItem>
                                                        <SelectItem value="GBP">GBP</SelectItem>
                                                        <SelectItem value="SAR">SAR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">Payment Type</Label>
                                            <Select value={structuredData.payment_type} onValueChange={(v: any) => updateStructuredData({ payment_type: v })}>
                                                <SelectTrigger className="h-10 border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Fixed">Fixed Price</SelectItem>
                                                    <SelectItem value="Hourly">Hourly Rate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">Tax Rate (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={structuredData.tax_rate}
                                                onChange={(e) => updateStructuredData({ tax_rate: Number(e.target.value) })}
                                                className="h-10 border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600">Paper Size</Label>
                                            <Select value={structuredData.paper_size} onValueChange={(v: any) => updateStructuredData({ paper_size: v })}>
                                                <SelectTrigger className="h-10 border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A4">A4</SelectItem>
                                                    <SelectItem value="LETTER">Letter</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Legal Clauses */}
                                <div className="space-y-3 pt-4 border-t border-dashed border-slate-200">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Legal Clauses
                                    </h4>

                                    <div className="rounded-xl border border-slate-100 divide-y divide-slate-50">
                                        {/* NDA */}
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">Confidentiality (NDA)</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Protect trade secrets and client data</p>
                                            </div>
                                            <Switch
                                                checked={structuredData.nda_included}
                                                onCheckedChange={(v) => updateStructuredData({ nda_included: v })}
                                            />
                                        </div>

                                        {/* IP Ownership */}
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">IP Ownership</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Who owns the final deliverables?</p>
                                            </div>
                                            <Select value={structuredData.ip_ownership} onValueChange={(v: any) => updateStructuredData({ ip_ownership: v })}>
                                                <SelectTrigger className="w-44 h-9 border-slate-200 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Full">Full Transfer</SelectItem>
                                                    <SelectItem value="After Payment">After Final Payment</SelectItem>
                                                    <SelectItem value="License">Limited License</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Revisions */}
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">Included Revisions</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Number of free revision rounds</p>
                                            </div>
                                            <Input
                                                type="number"
                                                value={structuredData.revisions_included}
                                                onChange={(e) => updateStructuredData({ revisions_included: Number(e.target.value) })}
                                                className="w-20 h-9 border-slate-200 text-center font-semibold"
                                            />
                                        </div>

                                        {/* Termination Notice */}
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">Termination Notice</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Days of notice required</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="number"
                                                    value={structuredData.termination_notice_days}
                                                    onChange={(e) => updateStructuredData({ termination_notice_days: Number(e.target.value) })}
                                                    className="w-20 h-9 border-slate-200 text-center font-semibold"
                                                />
                                                <span className="text-xs text-slate-400 shrink-0">days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-slate-500 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold gap-2 min-w-[140px]"
                        >
                            {loading
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                : isEdit ? 'Save Changes' : 'Create Template'
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
