"use client"

import { useState } from "react"
import { deleteContract } from "@/app/(dashboard)/contracts/actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DeleteContractDialogProps {
    contractId: string
    contractTitle: string
}

export function DeleteContractDialog({ contractId, contractTitle }: DeleteContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            await deleteContract(contractId)
            setOpen(false)
            router.push('/contracts') // Fixed path from /dashboard/contracts to /contracts based on earlier context
        } catch (error) {
            console.error("Failed to delete contract", error)
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                {/* ── Header ── */}
                <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Delete Contract</h2>
                        <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="px-6 py-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to permanently delete{" "}
                        <span className="font-bold text-slate-900">&ldquo;{contractTitle}&rdquo;</span>?
                        Any associated data and signing history will be lost forever.
                    </p>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                        className="text-slate-500 font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="gap-2 font-bold shadow-lg shadow-red-500/10"
                    >
                        {isDeleting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                        ) : (
                            <><Trash2 className="h-4 w-4" /> Delete Permanently</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
