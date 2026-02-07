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
            setOpen(false)
            router.push('/invoices')
        } catch (error) {
            console.error("Failed to delete invoice", error)
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
