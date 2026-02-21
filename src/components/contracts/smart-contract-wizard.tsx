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
    Briefcase
} from "lucide-react"
import { format } from "date-fns"

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
    { id: 1, title: "Context", description: "Select client and template" },
    { id: 2, title: "Terms", description: "Financial and legal details" },
    { id: 3, title: "Scope", description: "Define deliverables" },
    { id: 4, title: "Review", description: "Generate and finalize" },
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
            // Reset to defaults
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
            })
        }
    }, [open])

    const handleTemplateSelect = (t: ContractTemplate) => {
        setTemplateId(t.id)
        if (t.contract_data) {
            // Merge template defaults into structured data
            setStructuredData(prev => ({
                ...prev,
                ...t.contract_data,
                // Preserve deliverables if user already started typing? 
                // For now, let's keep it simple and overwrite but preserve what's not in template
                deliverables: (t.contract_data as any).deliverables?.length ? (t.contract_data as any).deliverables : prev.deliverables
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
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold">
                    <Plus className="mr-2 h-4 w-4" /> Smart Contract Assistant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="flex flex-col h-[650px]">
                    {/* Header with Steps */}
                    <div className="bg-slate-900 text-white p-6 pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                    Smart Contract Assistant
                                </h2>
                                <p className="text-slate-400 text-sm">Building a secure and clear agreement</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Step {currentStep} of 4</span>
                            </div>
                        </div>

                        <div className="flex gap-2 relative">
                            {STEPS.map((step) => (
                                <div key={step.id} className="flex-1 flex flex-col gap-2 relative z-10">
                                    <div className={`h-1 rounded-full transition-all duration-500 ${currentStep >= step.id ? 'bg-brand-primary' : 'bg-slate-700'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-tight text-center ${currentStep >= step.id ? 'text-brand-primary' : 'text-slate-500'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto p-8 relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title" className="text-sm font-semibold">Contract Title</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g. Website Redesign Agreement"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="h-12 border-slate-200 focus:ring-brand-primary"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Client</Label>
                                                <Select value={clientId} onValueChange={setClientId}>
                                                    <SelectTrigger className="h-12 border-slate-200">
                                                        <SelectValue placeholder="Select client..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clients.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Project (Optional)</Label>
                                                <Select value={projectId} onValueChange={setProjectId} disabled={!clientId}>
                                                    <SelectTrigger className="h-12 border-slate-200">
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

                                        <div className="grid gap-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-brand-primary" />
                                                Template Base
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {templates.map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => handleTemplateSelect(t)}
                                                        className={`p-4 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 flex items-center gap-3 ${templateId === t.id ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary' : 'border-slate-200'}`}
                                                    >
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${templateId === t.id ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{t.name}</span>
                                                            {t.contract_data && (
                                                                <span className="text-[10px] text-brand-primary/60 font-semibold uppercase tracking-tighter">Smart Defaults Active</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Budget & Currency</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={structuredData.total_amount || ""}
                                                        onChange={(e) => updateStructuredData({ total_amount: Number(e.target.value) })}
                                                        className="h-12"
                                                    />
                                                    <Select value={structuredData.currency} onValueChange={(v: string) => updateStructuredData({ currency: v })}>
                                                        <SelectTrigger className="w-24 h-12">
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
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Payment Type</Label>
                                                <Select value={structuredData.payment_type} onValueChange={(v: "Fixed" | "Hourly") => updateStructuredData({ payment_type: v })}>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Fixed">Fixed Price</SelectItem>
                                                        <SelectItem value="Hourly">Hourly Rate</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={structuredData.start_date}
                                                    onChange={(e) => updateStructuredData({ start_date: e.target.value })}
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-sm font-semibold">End Date</Label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Open-ended</span>
                                                        <Switch
                                                            checked={structuredData.is_open_ended}
                                                            onCheckedChange={(v: boolean) => updateStructuredData({ is_open_ended: v, end_date: v ? null : structuredData.end_date })}
                                                        />
                                                    </div>
                                                </div>
                                                <Input
                                                    type="date"
                                                    disabled={structuredData.is_open_ended}
                                                    value={structuredData.end_date || ""}
                                                    onChange={(e) => updateStructuredData({ end_date: e.target.value })}
                                                    className="h-12"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Legal & Clauses</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-semibold">Confidentiality (NDA)</Label>
                                                    <p className="text-xs text-muted-foreground">Protect your trade secrets and client data</p>
                                                </div>
                                                <Switch
                                                    checked={structuredData.nda_included}
                                                    onCheckedChange={(v: boolean) => updateStructuredData({ nda_included: v })}
                                                />
                                            </div>
                                            <div className="pt-2 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-semibold">IP Ownership</Label>
                                                    <p className="text-xs text-muted-foreground">Who owns the final results?</p>
                                                </div>
                                                <Select value={structuredData.ip_ownership} onValueChange={(v: "Full" | "License" | "After Payment") => updateStructuredData({ ip_ownership: v })}>
                                                    <SelectTrigger className="w-40 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Full">Freelancer Full Transfer</SelectItem>
                                                        <SelectItem value="After Payment">Transfer After Final Payment</SelectItem>
                                                        <SelectItem value="License">Limited Usage License</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold">Project Deliverables</h3>
                                                <p className="text-sm text-muted-foreground">List everything you will deliver to the client</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={addDeliverable}>
                                                <Plus className="h-4 w-4 mr-1 text-brand-primary" /> Add Item
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {structuredData.deliverables?.map((deliverable, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs">
                                                        {index + 1}
                                                    </div>
                                                    <Input
                                                        placeholder="e.g. Homepage UI Mockup (Figma)"
                                                        value={deliverable}
                                                        onChange={(e) => updateDeliverable(index, e.target.value)}
                                                        className="h-10 border-slate-200"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-400 hover:text-red-500"
                                                        onClick={() => removeDeliverable(index)}
                                                        disabled={structuredData.deliverables!.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-dashed">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-sm font-semibold">Included Revisions</Label>
                                                    <Input
                                                        type="number"
                                                        value={structuredData.revisions_included}
                                                        onChange={(e) => updateStructuredData({ revisions_included: Number(e.target.value) })}
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-sm font-semibold">Termination Notice (Days)</Label>
                                                    <Input
                                                        type="number"
                                                        value={structuredData.termination_notice_days}
                                                        onChange={(e) => updateStructuredData({ termination_notice_days: Number(e.target.value) })}
                                                        className="h-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="flex flex-col h-full space-y-4">
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                                            <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-emerald-900">Contract Ready!</h4>
                                                <p className="text-xs text-emerald-700">The structured data has been successfully injected into the template. Review the text below before saving.</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col min-h-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Label className="text-xs font-bold uppercase text-slate-500">Document Review</Label>
                                                <Badge variant="outline" className="text-[10px]">Editable</Badge>
                                            </div>
                                            <Textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="flex-1 min-h-0 text-sm font-serif leading-relaxed bg-white border-slate-200 resize-none p-6 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-6 bg-slate-50 border-t items-center sm:justify-between flex-row">
                        <div className="hidden sm:flex items-center gap-4">
                            {currentStep > 1 && (
                                <Button variant="ghost" className="text-slate-500" onClick={() => setCurrentStep(currentStep - 1)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {currentStep < 4 ? (
                                <Button
                                    className="w-full sm:w-auto bg-brand-primary"
                                    disabled={isNextDisabled()}
                                    onClick={() => currentStep === 3 ? handleGenerate() : setCurrentStep(currentStep + 1)}
                                >
                                    {currentStep === 3 ? "Generate Draft" : "Next Step"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button className="w-full sm:w-auto bg-brand-primary" disabled={loading} onClick={handleSave}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Finalize & Save Draft
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
