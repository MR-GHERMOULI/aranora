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
import { updateContract } from "@/app/(dashboard)/contracts/actions"
import { Contract, Client, Project } from "@/types"
import { useRouter } from "next/navigation"

const contractSchema = z.object({
    title: z.string().min(2, "Title is required"),
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters"),
})

type ContractFormValues = z.infer<typeof contractSchema>

interface EditContractDialogProps {
    contract: Contract;
    clients: Client[];
    projects: Project[];
}

export function EditContractDialog({ contract, clients, projects }: EditContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            title: contract.title,
            clientId: contract.client_id,
            projectId: contract.project_id || "",
            content: contract.content || "",
        }
    })

    const selectedClientId = watch("clientId");
    const filteredProjects = selectedClientId
        ? projects.filter(p => p.client_id === selectedClientId)
        : [];

    async function onSubmit(data: ContractFormValues) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", contract.id)
            formData.append("title", data.title)
            formData.append("clientId", data.clientId)
            if (data.projectId) formData.append("projectId", data.projectId)
            formData.append("content", data.content)

            await updateContract(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update contract")
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Contract</DialogTitle>
                    <DialogDescription>
                        Modify contract details and terms.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Contract Title</Label>
                            <Input
                                id="title"
                                placeholder="Service Agreement - Q1"
                                {...register("title")}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clientId">Client</Label>
                                <select
                                    id="clientId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register("clientId")}
                                >
                                    <option value="">Select client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="projectId">Project (Optional)</Label>
                                <select
                                    id="projectId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register("projectId")}
                                    disabled={!selectedClientId}
                                >
                                    <option value="">Select project...</option>
                                    {filteredProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">Contract Terms</Label>
                            <textarea
                                id="content"
                                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm "
                                placeholder="Enter contract terms here..."
                                {...register("content")}
                            />
                            {errors.content && (
                                <p className="text-sm text-red-500">{errors.content.message}</p>
                            )}
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
