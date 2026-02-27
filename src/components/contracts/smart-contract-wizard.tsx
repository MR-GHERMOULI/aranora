"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    Loader2,
    FileText,
    ArrowRight,
    ArrowLeft,
    Check,
    Trash2,
    Calendar as CalendarIcon,
    DollarSign,
    ShieldCheck,
    Briefcase,
    Sparkles,
    CheckCircle2,
    Layers,
    Info,
    ChevronRight,
    Search,
    Clock
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { createSmartContract } from "@/app/(dashboard)/contracts/actions"
import { Client, Project, ContractTemplate, ContractStructuredData } from "@/types"
import { injectContractData } from "@/lib/contracts/template-engine"
import { motion, AnimatePresence } from "framer-motion"

interface SmartContractWizardProps {
    clients: Client[];
    projects: Project[];
    templates?: ContractTemplate[];
    freelancerName: string;
}

const STEPS = [
    { id: 1, title: "Context", description: "Identity & Base" },
    { id: 2, title: "Terms", description: "Values & Dates" },
    { id: 3, title: "Scope", description: "Deliverables" },
    { id: 4, title: "Review", description: "Final Draft" },
]

export function SmartContractWizard({ clients, projects, templates = [], freelancerName }: SmartContractWizardProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    // Form State
    const [title, setTitle] = useState("")
    const [clientId, setClientId] = useState("")
    const [projectId, setProjectId] = useState("")
    const [templateId, setTemplateId] = useState("")
    const [content, setContent] = useState("")

    // Structured Data State
    const [structuredData, setStructuredData] = useState<ContractStructuredData>({
        currency: "USD",
        total_amount: 0,
        payment_type: "Fixed",
        payment_schedule: "On Completion",
        start_date: new Date().toISOString().split('T')[0],
        is_open_ended: false,
        revisions_included: 2,
        termination_notice_days: 14,
        deliverables: [""],
        governing_law: "the local jurisdiction",
        nda_included: true,
        ip_ownership: "Full",
        paper_size: "A4",
        tax_rate: 0,
        late_fee_percentage: 0,
        rush_fee: 0,
        milestones: [],
        non_compete_included: false,
    })

    const selectedClient = clients.find(c => c.id === clientId)
    const filteredProjects = clientId ? projects.filter(p => p.client_id === clientId) : []

    // Reset wizard when opened
    useEffect(() => {
        if (open) {
            setCurrentStep(1)
            setTitle("")
            setClientId("")
            setProjectId("")
            setTemplateId("")
            setContent("")
            setStructuredData({
                currency: "USD",
                total_amount: 0,
                payment_type: "Fixed",
                payment_schedule: "On Completion",
                start_date: new Date().toISOString().split('T')[0],
                is_open_ended: false,
                revisions_included: 2,
                termination_notice_days: 14,
                deliverables: [""],
                governing_law: "the local jurisdiction",
                nda_included: true,
                ip_ownership: "Full",
                paper_size: "A4",
                tax_rate: 0,
                late_fee_percentage: 0,
                rush_fee: 0,
                milestones: [],
                non_compete_included: false,
            })
        }
    }, [open])

    const handleTemplateSelect = (t: ContractTemplate) => {
        setTemplateId(t.id)
        if (t.contract_data) {
            setStructuredData(prev => ({
                ...prev,
                ...t.contract_data,
                deliverables: (t.contract_data as any).deliverables?.length ? (t.contract_data as any).deliverables : prev.deliverables,
                milestones: (t.contract_data as any).milestones?.length ? (t.contract_data as any).milestones : prev.milestones
            }))
        }
    }

    const updateStructuredData = (updates: Partial<ContractStructuredData>) => {
        setStructuredData(prev => ({ ...prev, ...updates }))
    }

    const addDeliverable = () => {
        updateStructuredData({ deliverables: [...(structuredData.deliverables || []), ""] })
    }

    const removeDeliverable = (index: number) => {
        const newDeliverables = [...(structuredData.deliverables || [])]
        newDeliverables.splice(index, 1)
        updateStructuredData({ deliverables: newDeliverables })
    }

    const updateDeliverable = (index: number, value: string) => {
        const newDeliverables = [...(structuredData.deliverables || [])]
        newDeliverables[index] = value
        updateStructuredData({ deliverables: newDeliverables })
    }

    const addMilestone = () => {
        updateStructuredData({ milestones: [...(structuredData.milestones || []), { name: "", amount: 0, due_date: "" }] })
    }

    const removeMilestone = (index: number) => {
        const newMilestones = [...(structuredData.milestones || [])]
        newMilestones.splice(index, 1)
        updateStructuredData({ milestones: newMilestones })
    }

    const updateMilestone = (index: number, updates: Partial<{ name: string; amount: number; due_date: string }>) => {
        const newMilestones = [...(structuredData.milestones || [])]
        newMilestones[index] = { ...newMilestones[index], ...updates }
        updateStructuredData({ milestones: newMilestones })
    }

    const handleGenerate = () => {
        const template = templates.find(t => t.id === templateId) || templates[0]
        if (!template) return

        const generatedContent = injectContractData(
            template.content,
            structuredData,
            { freelancerName, clientName: selectedClient?.name || "[Client Name]" }
        )
        setContent(generatedContent)
        setCurrentStep(4)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await createSmartContract({
                clientId,
                projectId: projectId || null,
                title,
                content,
                contractData: structuredData
            })
            setOpen(false)
        } catch (error) {
            console.error(error)
            alert("Failed to create contract")
        } finally {
            setLoading(false)
        }
    }

    const isNextDisabled = () => {
        if (currentStep === 1) return !title || !clientId || !templateId
        if (currentStep === 2) return !structuredData.total_amount || !structuredData.start_date
        if (currentStep === 3) return !structuredData.deliverables?.some(d => d.trim() !== "")
        return false
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-11 px-6 shadow-lg shadow-brand-primary/20 gap-2 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Sparkles className="h-4 w-4" />
                    Smart Contract Assistant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                <div className="flex flex-col h-[720px] bg-white">
                    {/* ── Dark Header ── */}
                    <div className="bg-slate-900 text-white px-8 pt-8 pb-6 shrink-0 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px]" />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center ring-1 ring-white/10">
                                    <ShieldCheck className="h-7 w-7 text-brand-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Smart Contract Assistant</h2>
                                    <p className="text-slate-400 text-sm mt-0.5">Generate professional, secure agreements in minutes.</p>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Step {currentStep} of 4</span>
                                <div className="text-sm font-semibold text-brand-primary mt-1">{STEPS[currentStep - 1].title}</div>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="relative z-10 flex gap-3">
                            {STEPS.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={step.id} className="flex-1 group">
                                        <div className="relative">
                                            <div className={`h-1.5 rounded-full transition-all duration-700 ${isCompleted ? 'bg-brand-primary' : isActive ? 'bg-brand-primary/40' : 'bg-slate-800'}`} />
                                            {isActive && (
                                                <motion.div
                                                    layoutId="step-glow"
                                                    className="absolute inset-0 bg-brand-primary rounded-full blur-md opacity-40"
                                                />
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold transition-colors ${isCompleted ? 'bg-brand-primary text-white' : isActive ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' : 'bg-slate-800 text-slate-500'}`}>
                                                {isCompleted ? <Check className="h-2.5 w-2.5" /> : step.id}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-brand-primary' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                                                    {step.title}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Content Area ── */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="h-full px-8 py-8"
                            >
                                {currentStep === 1 && (
                                    <div className="space-y-8 max-w-2xl mx-auto">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-brand-primary rounded-full" />
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Contract Basics</h3>
                                            </div>
                                            <div className="grid gap-3">
                                                <Label htmlFor="smart-title" className="text-xs font-bold text-slate-600 uppercase">Contract Title</Label>
                                                <div className="relative group">
                                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                                                    <Input
                                                        id="smart-title"
                                                        placeholder="e.g. Website Design & Development Agreement"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="h-13 pl-12 bg-white border-slate-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary rounded-xl font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 uppercase">Choose Client</Label>
                                                <Select value={clientId} onValueChange={setClientId}>
                                                    <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl">
                                                        <SelectValue placeholder="Select client..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clients.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 uppercase">Related Project</Label>
                                                <Select value={projectId} onValueChange={setProjectId} disabled={!clientId}>
                                                    <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl">
                                                        <SelectValue placeholder="Select project (Optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredProjects.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-1 bg-violet-500 rounded-full" />
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Select Template Base</h3>
                                                </div>
                                                <Badge variant="secondary" className="bg-violet-50 text-violet-600 border-violet-100 text-[10px]">
                                                    {templates.length} AVAILABLE
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {templates.map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => handleTemplateSelect(t)}
                                                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${templateId === t.id ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/20' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                                                    >
                                                        <div className="flex items-center gap-4 relative z-10">
                                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${templateId === t.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500'}`}>
                                                                <Layers className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0 pr-4">
                                                                <span className={`text-sm font-bold truncate ${templateId === t.id ? 'text-slate-900' : 'text-slate-600'}`}>{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Reusable legally-vetted draft</span>
                                                            </div>
                                                            {templateId === t.id && (
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                                    <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center">
                                                                        <Check className="h-3 w-3 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {t.contract_data && (
                                                            <div className="mt-3 flex items-center gap-1.5 opacity-60">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Smart Defaults Injected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-8 max-w-2xl mx-auto">
                                        <div className="grid gap-8">
                                            {/* Financials Row */}
                                            <section className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                                    <DollarSign className="h-32 w-32" />
                                                </div>
                                                <div className="relative z-10 space-y-6">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-5 w-5 text-emerald-400" />
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Financial Terms</h4>
                                                    </div>
                                                    <div className="grid sm:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-bold text-slate-400 uppercase">Total Contract Value</Label>
                                                            <div className="flex gap-0 group">
                                                                <div className="h-12 w-12 rounded-l-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                                                                    <DollarSign className="h-5 w-5" />
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={structuredData.total_amount || ""}
                                                                    onChange={(e) => updateStructuredData({ total_amount: Number(e.target.value) })}
                                                                    className="h-12 bg-white border-brand-primary text-slate-900 rounded-none rounded-r-xl border-l-0 text-lg font-bold px-4"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-bold text-slate-400 uppercase">Currency, Type & Schedule</Label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <Select value={structuredData.currency} onValueChange={(v: string) => updateStructuredData({ currency: v })}>
                                                                    <SelectTrigger className="h-12 bg-slate-800 border-slate-700 rounded-xl text-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                                                        <SelectItem value="SAR">SAR (﷼)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select value={structuredData.payment_type} onValueChange={(v: "Fixed" | "Hourly") => updateStructuredData({ payment_type: v })}>
                                                                    <SelectTrigger className="h-12 bg-slate-800 border-slate-700 rounded-xl text-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                                                        <SelectItem value="Hourly">Hourly</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select value={structuredData.payment_schedule} onValueChange={(v: "Upfront" | "Milestones" | "On Completion" | "Custom") => updateStructuredData({ payment_schedule: v })}>
                                                                    <SelectTrigger className="h-12 bg-slate-800 border-slate-700 rounded-xl text-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Upfront">Upfront</SelectItem>
                                                                        <SelectItem value="Milestones">Milestones</SelectItem>
                                                                        <SelectItem value="On Completion">On Completion</SelectItem>
                                                                        <SelectItem value="Custom">Custom</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Late & Rush Fees */}
                                                    <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-bold text-slate-400 uppercase">Late Fee %</Label>
                                                            <div className="flex gap-0 group">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={structuredData.late_fee_percentage || ""}
                                                                    onChange={(e) => updateStructuredData({ late_fee_percentage: Number(e.target.value) })}
                                                                    className="h-12 bg-slate-800 border-slate-700 text-white rounded-none rounded-l-xl text-sm px-4 focus-visible:ring-emerald-400"
                                                                />
                                                                <div className="h-12 w-12 rounded-r-xl bg-slate-700 border-y border-r border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                                                                    %
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-bold text-slate-400 uppercase">Rush Fee</Label>
                                                            <div className="flex gap-0 group">
                                                                <div className="h-12 w-12 rounded-l-xl bg-slate-800 border-y border-l border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                                                    <DollarSign className="h-4 w-4" />
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={structuredData.rush_fee || ""}
                                                                    onChange={(e) => updateStructuredData({ rush_fee: Number(e.target.value) })}
                                                                    className="h-12 bg-slate-800 border-slate-700 text-white rounded-none rounded-r-xl text-sm px-4 focus-visible:ring-emerald-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Dynamic Milestones Builder */}
                                                    <AnimatePresence>
                                                        {structuredData.payment_schedule === 'Milestones' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="pt-4 border-t border-slate-800 overflow-hidden"
                                                            >
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <Label className="text-xs font-bold text-slate-400 uppercase">Payment Milestones</Label>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={addMilestone}
                                                                        className="h-7 text-xs border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 bg-transparent"
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Add Milestone
                                                                    </Button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {structuredData.milestones?.map((milestone, index) => (
                                                                        <div key={index} className="flex gap-2 items-start">
                                                                            <div className="flex-1 space-y-2">
                                                                                <Input
                                                                                    placeholder="Milestone Name (e.g. 50% Upfront)"
                                                                                    value={milestone.name}
                                                                                    onChange={(e) => updateMilestone(index, { name: e.target.value })}
                                                                                    className="h-9 bg-slate-800 border-slate-700 text-white text-sm"
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <div className="relative flex-1">
                                                                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                                                                        <Input
                                                                                            type="number"
                                                                                            placeholder="Amount"
                                                                                            value={milestone.amount || ""}
                                                                                            onChange={(e) => updateMilestone(index, { amount: Number(e.target.value) })}
                                                                                            className="h-9 pl-8 bg-slate-800 border-slate-700 text-white text-sm"
                                                                                        />
                                                                                    </div>
                                                                                    <Input
                                                                                        type="date"
                                                                                        value={milestone.due_date || ""}
                                                                                        onChange={(e) => updateMilestone(index, { due_date: e.target.value })}
                                                                                        className="h-9 flex-1 bg-slate-800 border-slate-700 text-white text-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => removeMilestone(index)}
                                                                                className="h-9 w-9 text-slate-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    {structuredData.milestones?.length === 0 && (
                                                                        <div className="text-center py-4 text-xs text-slate-500 italic">
                                                                            No milestones added. Click "Add Milestone" to begin.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </section>

                                            {/* Timing Details */}
                                            <section className="space-y-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Timeline & Duration</h3>
                                                </div>
                                                <div className="grid sm:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-bold text-slate-600 uppercase">Commencement Date</Label>
                                                        <div className="relative">
                                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                type="date"
                                                                value={structuredData.start_date}
                                                                onChange={(e) => updateStructuredData({ start_date: e.target.value })}
                                                                className="h-12 pl-12 bg-white border-slate-200 rounded-xl font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-bold text-slate-600 uppercase">Estimated End Date</Label>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Open ended</span>
                                                                <Switch
                                                                    className="scale-75 origin-right"
                                                                    checked={structuredData.is_open_ended}
                                                                    onCheckedChange={(v: boolean) => updateStructuredData({ is_open_ended: v, end_date: v ? null : structuredData.end_date })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                type="date"
                                                                disabled={structuredData.is_open_ended}
                                                                value={structuredData.end_date || ""}
                                                                onChange={(e) => updateStructuredData({ end_date: e.target.value })}
                                                                className="h-12 pl-12 bg-white border-slate-200 rounded-xl font-medium disabled:bg-slate-50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Legal Checks Card */}
                                            <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-5">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                                    <h4 className="text-sm font-bold text-slate-800">Legal Provisions</h4>
                                                </div>

                                                <div className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-600 uppercase">Governing Law / Jurisdiction</Label>
                                                        <Input
                                                            placeholder="e.g. State of California, USA"
                                                            value={structuredData.governing_law}
                                                            onChange={(e) => updateStructuredData({ governing_law: e.target.value })}
                                                            className="h-10 bg-slate-50 border-slate-200"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="divide-y divide-slate-50 border-t border-slate-50 mt-4">
                                                    <div className="py-4 flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700 group-hover:text-brand-primary transition-colors">Confidentiality (NDA)</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">Protect proprietary information & trade secrets</p>
                                                        </div>
                                                        <Switch
                                                            checked={structuredData.nda_included}
                                                            onCheckedChange={(v: boolean) => updateStructuredData({ nda_included: v })}
                                                        />
                                                    </div>
                                                    <div className="py-4 flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700 group-hover:text-brand-primary transition-colors">Non-Compete Clause</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">Restrict working with direct competitors</p>
                                                        </div>
                                                        <Switch
                                                            checked={structuredData.non_compete_included}
                                                            onCheckedChange={(v: boolean) => updateStructuredData({ non_compete_included: v })}
                                                        />
                                                    </div>
                                                    <div className="py-4 flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700 group-hover:text-brand-primary transition-colors">IP Ownership Transfer</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">Who holds copyright upon total fulfillment?</p>
                                                        </div>
                                                        <Select value={structuredData.ip_ownership} onValueChange={(v: "Full" | "License" | "After Payment") => updateStructuredData({ ip_ownership: v })}>
                                                            <SelectTrigger className="w-48 h-10 bg-slate-50/50 border-slate-200">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Full">Service Provider Full</SelectItem>
                                                                <SelectItem value="After Payment">Post Final Payment</SelectItem>
                                                                <SelectItem value="License">Usage License Only</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-8 max-w-2xl mx-auto">
                                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-1 bg-violet-600 rounded-full" />
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Project Deliverables</h3>
                                                </div>
                                                <p className="text-sm text-slate-500">Specify exactly what the client will receive.</p>
                                            </div>
                                            <Button
                                                onClick={addDeliverable}
                                                className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold h-9 px-4 rounded-lg border border-violet-200 gap-2 shrink-0 transition-all hover:scale-[1.03]"
                                            >
                                                <Plus className="h-4 w-4" /> Add Item
                                            </Button>
                                        </div>

                                        <div className="space-y-3 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm min-h-[300px]">
                                            {structuredData.deliverables?.map((deliverable, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex gap-3 group"
                                                >
                                                    <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${deliverable ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-slate-50 text-slate-400'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <Input
                                                        placeholder="e.g. Interactive Prototype in Figma / High-fidelity mockup"
                                                        value={deliverable}
                                                        onChange={(e) => updateDeliverable(index, e.target.value)}
                                                        className="h-12 flex-1 rounded-xl bg-slate-50 focus:bg-white border-transparent focus:border-violet-200 focus-visible:ring-violet-100/30 transition-all font-medium"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeDeliverable(index)}
                                                        disabled={structuredData.deliverables!.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {structuredData.deliverables?.length === 0 && (
                                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <Layers className="h-8 w-8 opacity-20" />
                                                    <p className="text-sm italic">No deliverables added yet.</p>
                                                </div>
                                            )}
                                        </div>

                                        <section className="grid sm:grid-cols-2 gap-6 pt-2">
                                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Revision Rounds</Label>
                                                    <Info className="h-3.5 w-3.5 text-slate-300" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={structuredData.revisions_included}
                                                    onChange={(e) => updateStructuredData({ revisions_included: Number(e.target.value) })}
                                                    className="h-11 rounded-xl border-slate-200 font-bold text-lg text-slate-800"
                                                />
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Termination Notice (Days)</Label>
                                                    <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        value={structuredData.termination_notice_days}
                                                        onChange={(e) => updateStructuredData({ termination_notice_days: Number(e.target.value) })}
                                                        className="h-11 rounded-xl border-slate-200 font-bold text-lg text-slate-800"
                                                    />
                                                    <div className="h-11 px-4 flex items-center bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 tracking-widest uppercase">Days</div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="flex flex-col h-full space-y-5 max-w-3xl mx-auto">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 p-5 rounded-2xl flex items-center gap-4 shrink-0 shadow-sm shadow-emerald-500/5"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-emerald-900">Contract Ready for Review</h4>
                                                <p className="text-xs text-emerald-700/80 font-medium">Smart data has been successfully injected into your {templates.find(t => t.id === templateId)?.name}.</p>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 font-bold text-[10px]">VERIFIED</Badge>
                                        </motion.div>

                                        <div className="flex-1 flex min-h-0 bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl relative">
                                            {/* Scrollable Document */}
                                            <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-none flex justify-center bg-slate-950/20">
                                                <div className="w-full max-w-[650px] bg-white shadow-2xl min-h-[850px] p-10 md:p-20 relative rounded-sm">
                                                    {/* Top Binder Edge */}
                                                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary/40 to-indigo-500/40" />

                                                    {/* Decorative Header */}
                                                    <div className="border-b border-slate-100 pb-8 mb-10 flex flex-col gap-2">
                                                        <div className="h-8 w-32 bg-slate-50 rounded flex items-center justify-center text-[10px] font-bold text-slate-300 tracking-[0.3em] uppercase">Document</div>
                                                        <h5 className="text-2xl font-serif text-slate-900 leading-tight">{title}</h5>
                                                    </div>

                                                    <Textarea
                                                        value={content}
                                                        onChange={(e) => setContent(e.target.value)}
                                                        className="w-full h-full min-h-[600px] text-[15px] font-serif leading-loose border-none focus-visible:ring-0 resize-none p-0 bg-transparent text-slate-950 placeholder:italic"
                                                        placeholder="Loading content..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Side Data Insights */}
                                            <div className="hidden lg:flex w-64 border-l border-slate-800 flex-col bg-slate-900/50 backdrop-blur-md">
                                                <div className="p-6 space-y-6">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Smart Insights</span>
                                                        <h4 className="text-xs font-bold text-white">Generated Provisions</h4>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Financials</span>
                                                                <span className="text-xs text-slate-300">{structuredData.total_amount} {structuredData.currency}</span>
                                                            </div>
                                                        </div>

                                                        {structuredData.milestones && structuredData.milestones.length > 0 && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                                    <Layers className="h-4 w-4 text-indigo-400" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Milestones</span>
                                                                    <span className="text-xs text-slate-300">{structuredData.milestones.length} Injected</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                                                <ShieldCheck className="h-4 w-4 text-violet-400" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-tight">Legal Protection</span>
                                                                <span className="text-xs text-slate-300">
                                                                    {structuredData.nda_included ? 'NDA' : ''}
                                                                    {structuredData.nda_included && structuredData.non_compete_included ? ' + ' : ''}
                                                                    {structuredData.non_compete_included ? 'Non-Compete' : ''}
                                                                    {!structuredData.nda_included && !structuredData.non_compete_included ? 'Basic' : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-slate-800">
                                                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Info className="h-3 w-3 text-orange-400" />
                                                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tight">Editor Tip</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">You can manually edit the content on the left. Changes are saved automatically as you type.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview Overlay Label */}
                                            <div className="absolute top-4 right-4 z-20 lg:right-[calc(16rem+1rem)]">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white tracking-widest uppercase">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                    Live Preview
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Footer ── */}
                    <div className="p-6 bg-slate-50/80 backdrop-blur-xl border-t border-slate-100 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {currentStep > 1 && (
                                <Button
                                    variant="ghost"
                                    className="h-11 px-6 text-slate-500 hover:text-slate-900 font-bold rounded-xl gap-2 transition-all"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </Button>
                            )}
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-2 block sm:hidden">STEP {currentStep}/4</div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                className="h-11 px-6 text-slate-400 font-bold rounded-xl"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>

                            {currentStep < 4 ? (
                                <Button
                                    className="h-11 px-8 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 gap-2 transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    disabled={isNextDisabled()}
                                    onClick={() => currentStep === 3 ? handleGenerate() : setCurrentStep(currentStep + 1)}
                                >
                                    {currentStep === 3 ? "Generate Final Draft" : "Next Milestone"}
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    className="h-11 px-10 bg-brand-primary text-white font-bold rounded-xl shadow-xl shadow-brand-primary/25 gap-2 transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    disabled={loading}
                                    onClick={handleSave}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                    Finalize & Secure Agreement
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
