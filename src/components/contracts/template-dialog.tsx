"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Pencil, Loader2, ShieldCheck, DollarSign, Calendar as CalendarIcon, FileText } from "lucide-react"

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
import { createTemplate, updateTemplate } from "@/app/(dashboard)/contracts/actions"
import { ContractTemplate, ContractStructuredData } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function TemplateDialog({ template, trigger }: TemplateDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const isEdit = !!template;

    // Smart Defaults State
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
            if (!isEdit) reset()
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
                    <Button>
                        {isEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {isEdit ? 'Edit' : 'New Template'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update your contract template.' : 'Create a reusable contract template.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Web Development Agreement"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <Tabs defaultValue="content" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="content">Legal Text</TabsTrigger>
                                <TabsTrigger value="defaults">Smart Defaults</TabsTrigger>
                            </TabsList>
                            <TabsContent value="content" className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="content">Contract Terms</Label>
                                    <textarea
                                        id="content"
                                        className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Enter the default contract terms for this template..."
                                        {...register("content")}
                                    />
                                    {errors.content && (
                                        <p className="text-sm text-red-500">{errors.content.message}</p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-center tracking-widest mt-1">
                                        Use {"{{total_amount}}"}, {"{{deliverables}}"}, {"{{start_date}}"} as placeholders
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="defaults" className="grid gap-4 py-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" />
                                        Default Smart Terms
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-semibold">Default Budget</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    value={structuredData.total_amount || ""}
                                                    onChange={(e) => updateStructuredData({ total_amount: Number(e.target.value) })}
                                                    className="bg-white"
                                                />
                                                <Select value={structuredData.currency} onValueChange={(v) => updateStructuredData({ currency: v })}>
                                                    <SelectTrigger className="w-20 bg-white">
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
                                            <Label className="text-xs font-semibold">Payment Type</Label>
                                            <Select value={structuredData.payment_type} onValueChange={(v: any) => updateStructuredData({ payment_type: v })}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Fixed">Fixed Price</SelectItem>
                                                    <SelectItem value="Hourly">Hourly Rate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t pt-4 border-dashed">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">NDA Included</Label>
                                            <p className="text-[10px] text-muted-foreground">Default status for confidentiality</p>
                                        </div>
                                        <Switch
                                            checked={structuredData.nda_included}
                                            onCheckedChange={(v) => updateStructuredData({ nda_included: v })}
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Revisions Included</Label>
                                        </div>
                                        <Input
                                            type="number"
                                            value={structuredData.revisions_included}
                                            onChange={(e) => updateStructuredData({ revisions_included: Number(e.target.value) })}
                                            className="w-20 h-9 bg-white"
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">IP Ownership</Label>
                                        </div>
                                        <Select value={structuredData.ip_ownership} onValueChange={(v: any) => updateStructuredData({ ip_ownership: v })}>
                                            <SelectTrigger className="w-40 h-9 bg-white text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full">Full Transfer</SelectItem>
                                                <SelectItem value="After Payment">Transfer After Payment</SelectItem>
                                                <SelectItem value="License">Limited License</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-semibold">Paper Size</Label>
                                            <Select value={structuredData.paper_size} onValueChange={(v: any) => updateStructuredData({ paper_size: v })}>
                                                <SelectTrigger className="w-28 h-8 bg-white text-[10px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A4">A4</SelectItem>
                                                    <SelectItem value="LETTER">Letter</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between pl-4 border-l">
                                            <Label className="text-[11px] font-semibold">Tax Rate (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={structuredData.tax_rate}
                                                onChange={(e) => updateStructuredData({ tax_rate: Number(e.target.value) })}
                                                className="w-16 h-8 bg-white text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic px-4">
                                    These values will automatically populate the Smart Creator when this template is selected.
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
