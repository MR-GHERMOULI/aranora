"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Pencil, Loader2 } from "lucide-react"

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
import { updateClient } from "@/app/(dashboard)/clients/actions"
import { Client } from "@/types"
import { useRouter } from "next/navigation"

const clientSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    status: z.enum(["Potential", "Active", "Completed"]),
    notes: z.string().optional().or(z.literal("")),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface EditClientDialogProps {
    client: Client
}

export function EditClientDialog({ client }: EditClientDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client.name,
            email: client.email || "",
            phone: client.phone || "",
            status: client.status,
            notes: client.notes || "",
        },
    })

    async function onSubmit(data: ClientFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", client.id) // Important: pass the ID
            formData.append("name", data.name)
            if (data.email) formData.append("email", data.email)
            if (data.phone) formData.append("phone", data.phone)
            formData.append("status", data.status)
            if (data.notes) formData.append("notes", data.notes)

            await updateClient(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update client")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Client</DialogTitle>
                    <DialogDescription>
                        Update the details of your client here. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Acme Corp"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contact@acme.com"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="+1 234 567 890"
                                {...register("phone")}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register("status")}
                            >
                                <option value="Potential">Potential</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                placeholder="Key stakeholders..."
                                {...register("notes")}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
