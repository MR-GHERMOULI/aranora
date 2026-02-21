"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Pencil, Loader2 } from "lucide-react"

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
import { ContractTemplate } from "@/types"

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
            <DialogContent className="sm:max-w-[650px]">
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

                        <div className="grid gap-2">
                            <Label htmlFor="content">Contract Terms</Label>
                            <textarea
                                id="content"
                                className="flex min-h-[280px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Enter the default contract terms for this template...

Example:
1. Scope of Work
The Service Provider agrees to deliver the following services...

2. Payment Terms
The Client agrees to pay...

3. Timeline
Work will commence on [START_DATE] and be completed by [END_DATE]..."
                                {...register("content")}
                            />
                            {errors.content && (
                                <p className="text-sm text-red-500">{errors.content.message}</p>
                            )}
                        </div>
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
