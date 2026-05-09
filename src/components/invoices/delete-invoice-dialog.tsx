"use client"

import { useState } from "react"
import { deleteInvoice } from "@/app/(dashboard)/invoices/actions"
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
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { toast } from "sonner"

interface DeleteInvoiceDialogProps {
    invoiceId: string
    invoiceNumber: string
}

export function DeleteInvoiceDialog({ invoiceId, invoiceNumber }: DeleteInvoiceDialogProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            await deleteInvoice(invoiceId)
            toast.success("Invoice deleted successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Failed to delete invoice", error)
            toast.error("Failed to delete invoice")
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete invoice
                        <span className="font-semibold text-foreground"> {invoiceNumber} </span>
                        and remove it from our servers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
