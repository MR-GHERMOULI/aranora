"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

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
import { addCollaborator } from "@/app/(dashboard)/projects/collaborator-actions"
import { useRouter } from "next/navigation"

const collaboratorSchema = z.object({
    email: z.string().email("Invalid email address"),
    revenueShare: z.number().min(0).max(100),
})

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>

interface AddCollaboratorDialogProps {
    projectId: string
}

export function AddCollaboratorDialog({ projectId }: AddCollaboratorDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CollaboratorFormValues>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: {
            revenueShare: 0
        }
    })

    const [result, setResult] = useState<{ type: string, inviteLink?: string, message?: string } | null>(null)

    async function onSubmit(data: CollaboratorFormValues) {
        setLoading(true)
        setResult(null)
        try {
            const formData = new FormData()
            formData.append("projectId", projectId)
            formData.append("email", data.email)
            formData.append("revenueShare", data.revenueShare.toString())

            // @ts-ignore
            const response = await addCollaborator(formData)

            if (response?.type === 'new') {
                setResult(response)
                // Don't close dialog yet, let user copy link
                reset()
            } else {
                setOpen(false)
                reset()
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to add collaborator")
        } finally {
            setLoading(false)
        }
    }

    const copyLink = () => {
        if (result?.inviteLink) {
            navigator.clipboard.writeText(result.inviteLink)
            toast.success("Link copied!")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Collaborator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Collaborator</DialogTitle>
                    <DialogDescription>
                        Invite a freelancer to collaborate on this project.
                    </DialogDescription>
                </DialogHeader>

                {result?.type === 'new' ? (
                    <div className="py-4 space-y-4">
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
                            <p className="font-medium text-yellow-800 mb-1">User not found</p>
                            <p className="text-yellow-700">This email isn't registered yet. Share this invite link with them:</p>
                        </div>
                        <div className="flex gap-2">
                            <Input readOnly value={result.inviteLink} />
                            <Button size="icon" variant="outline" onClick={copyLink}>
                                <span className="sr-only">Copy</span>
                                📋
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => { setOpen(false); setResult(null); }}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="freelancer@example.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="revenueShare">Revenue Share (%)</Label>
                                <Input
                                    id="revenueShare"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    placeholder="25"
                                    {...register("revenueShare", { valueAsNumber: true })}
                                />
                                {errors.revenueShare && (
                                    <p className="text-sm text-red-500">{errors.revenueShare.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Percentage of project revenue allocated to this collaborator.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
