"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addCollaboratorPayment } from "@/app/(dashboard)/collaborators/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface AddPaymentDialogProps {
    collaboratorId: string
}

export function AddPaymentDialog({ collaboratorId }: AddPaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (!formData.get('amount')) {
            toast.error("Amount is required")
            return
        }

        setIsSubmitting(true)
        try {
            await addCollaboratorPayment(collaboratorId, formData)
            toast.success("Payment recorded successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Error recording payment:", error)
            toast.error("Failed to record payment")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10">
                    <Plus className="h-4 w-4" /> Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Track payouts made to this collaborator for your financial records.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="amount" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Amount *</label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">$</span>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                className="pl-7 bg-muted/30 h-11"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="paymentDate" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Date</label>
                        <Input
                            id="paymentDate"
                            name="paymentDate"
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="bg-muted/30 h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description / Project</label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="e.g., Logo Design Payment"
                            className="bg-muted/30 h-11"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
