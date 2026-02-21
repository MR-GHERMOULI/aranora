"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteTemplate } from "@/app/(dashboard)/contracts/actions"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteTemplateDialogProps {
    templateId: string;
    templateName: string;
}

export function DeleteTemplateDialog({ templateId, templateName }: DeleteTemplateDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        setLoading(true)
        try {
            await deleteTemplate(templateId)
            setOpen(false)
        } catch (error) {
            console.error(error)
            alert("Failed to delete template")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                {/* Header */}
                <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Delete Template</h2>
                        <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-900">&ldquo;{templateName}&rdquo;</span>?
                        {" "}Contracts that have already been created using this template will not be affected.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-slate-500 font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="gap-2 font-semibold"
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                            : <><Trash2 className="h-4 w-4" /> Delete Template</>
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
