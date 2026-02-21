"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCollaborator } from "@/app/(dashboard)/collaborators/actions"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Star } from "lucide-react"
import { toast } from "sonner"

export function AddCollaboratorDialog() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (!formData.get('fullName')) {
            toast.error("Full name is required")
            return
        }

        setIsSubmitting(true)
        try {
            await createCollaborator(formData)
            toast.success("Collaborator added successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Error adding collaborator:", error)
            toast.error("Failed to add collaborator")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-cyan-500/20 bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="h-4 w-4" /> Add Collaborator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">New Collaborator</DialogTitle>
                    <DialogDescription>
                        Save collaborator details for your directory. All information is private to you.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                            <Input id="fullName" name="fullName" placeholder="e.g., John Doe" required className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                            <Input id="phone" name="phone" placeholder="+1 234 567 890" className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="whatsapp" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
                            <Input id="whatsapp" name="whatsapp" placeholder="+1 234 567 890" className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="country" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
                            <Input id="country" name="country" placeholder="e.g., Algeria, USA" className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="dob" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth</label>
                            <Input id="dob" name="dob" type="date" className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="platformLink" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Profile Link</label>
                        <Input id="platformLink" name="platformLink" placeholder="https://..." className="bg-muted/30" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="rating" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Initial Rating</label>
                            <Select name="rating" defaultValue="5">
                                <SelectTrigger className="bg-muted/30">
                                    <SelectValue placeholder="Rate this collaborator" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 4, 3, 2, 1].map((n) => (
                                        <SelectItem key={n} value={n.toString()}>
                                            <div className="flex items-center gap-2">
                                                {n} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Private Notes & Evaluation</label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Strong communication skills, expert in React, etc."
                            className="min-h-[100px] bg-muted/30 resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 min-w-[120px]">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Collaborator"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
