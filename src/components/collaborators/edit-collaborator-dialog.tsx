"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateCollaborator } from "@/app/(dashboard)/collaborators/actions"
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
import { Loader2, Pencil, Star } from "lucide-react"
import { toast } from "sonner"
import { CollaboratorCRM } from "@/types"

interface EditCollaboratorDialogProps {
    collaborator: CollaboratorCRM
}

export function EditCollaboratorDialog({ collaborator }: EditCollaboratorDialogProps) {
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
            await updateCollaborator(collaborator.id, formData)
            toast.success("Collaborator updated successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Error updating collaborator:", error)
            toast.error("Failed to update collaborator")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-cyan-600 hover:bg-cyan-600/10 rounded-full transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Collaborator</DialogTitle>
                    <DialogDescription>
                        Update collaborator details in your directory. All information is private to you.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor={`fullName-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                            <Input id={`fullName-${collaborator.id}`} name="fullName" defaultValue={collaborator.full_name} required className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`email-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                            <Input id={`email-${collaborator.id}`} name="email" type="email" defaultValue={collaborator.email || ""} className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor={`phone-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                            <Input id={`phone-${collaborator.id}`} name="phone" defaultValue={collaborator.phone || ""} className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`whatsapp-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
                            <Input id={`whatsapp-${collaborator.id}`} name="whatsapp" defaultValue={collaborator.whatsapp || ""} className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor={`country-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
                            <Input id={`country-${collaborator.id}`} name="country" defaultValue={collaborator.country || ""} className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`dob-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth</label>
                            <Input id={`dob-${collaborator.id}`} name="dob" type="date" defaultValue={collaborator.date_of_birth ? new Date(collaborator.date_of_birth).toISOString().split('T')[0] : ""} className="bg-muted/30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor={`platformLink-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Profile Link</label>
                        <Input id={`platformLink-${collaborator.id}`} name="platformLink" defaultValue={collaborator.platform_profile_link || ""} className="bg-muted/30" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor={`rating-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rating</label>
                            <Select name="rating" defaultValue={collaborator.rating?.toString() || "5"}>
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
                        <label htmlFor={`notes-${collaborator.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Private Notes & Evaluation</label>
                        <Textarea
                            id={`notes-${collaborator.id}`}
                            name="notes"
                            defaultValue={collaborator.notes || ""}
                            className="min-h-[100px] bg-muted/30 resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 min-w-[120px]">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
