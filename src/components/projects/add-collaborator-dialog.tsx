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
import { getCollaborators } from "@/app/(dashboard)/collaborators/actions"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CollaboratorCRM } from "@/types"
import { useEffect } from "react"

const collaboratorSchema = z.object({
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    crmCollaboratorId: z.string().optional(),
    revenueShare: z.number().min(0).max(100).optional(),
    hourlyRate: z.number().min(0).optional(),
    paymentType: z.enum(["revenue_share", "hourly"]),
})

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>

interface AddCollaboratorDialogProps {
    projectId: string
}

export function AddCollaboratorDialog({ projectId }: AddCollaboratorDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [crmCollaborators, setCRMCollaborators] = useState<CollaboratorCRM[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            getCollaborators().then(setCRMCollaborators)
        }
    }, [open])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CollaboratorFormValues>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: {
            revenueShare: 0,
            hourlyRate: 0,
            paymentType: "revenue_share"
        }
    })

    const paymentType = watch("paymentType")
    const crmCollaboratorId = watch("crmCollaboratorId")

    const [result, setResult] = useState<{ type: string, inviteLink?: string, message?: string } | null>(null)

    async function onSubmit(data: CollaboratorFormValues) {
        setLoading(true)
        setResult(null)
        try {
            const formData = new FormData()
            formData.append("projectId", projectId)

            // Handle Selection Mode
            if (data.crmCollaboratorId && data.crmCollaboratorId !== "external") {
                const selected = crmCollaborators.find(c => c.id === data.crmCollaboratorId)
                if (selected?.email) {
                    formData.append("email", selected.email)
                }
            } else if (data.email) {
                formData.append("email", data.email)
            } else {
                toast.error("Please provide an email or select a collaborator")
                setLoading(false)
                return
            }

            formData.append("paymentType", data.paymentType)
            if (data.paymentType === "revenue_share") {
                formData.append("revenueShare", (data.revenueShare || 0).toString())
                formData.append("hourlyRate", "")
            } else {
                formData.append("hourlyRate", (data.hourlyRate || 0).toString())
                formData.append("revenueShare", "0")
            }

            // @ts-ignore
            const response = await addCollaborator(formData)

            if (response?.type === 'new') {
                setResult(response)
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
                            <p className="text-yellow-700">This email isn&apos;t registered yet. Share this invite link with them:</p>
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
                        <div className="grid gap-6 py-4">
                            <Tabs defaultValue="crm" onValueChange={(v) => setValue("crmCollaboratorId", v === "email" ? "external" : "")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="crm">From Directory</TabsTrigger>
                                    <TabsTrigger value="email">By Email</TabsTrigger>
                                </TabsList>
                                <TabsContent value="crm" className="space-y-4 pt-4">
                                    <div className="grid gap-2">
                                        <Label>Select Collaborator</Label>
                                        <Select onValueChange={(v) => setValue("crmCollaboratorId", v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose from CRM..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {crmCollaborators.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.full_name} ({c.email || "No email"})
                                                    </SelectItem>
                                                ))}
                                                {crmCollaborators.length === 0 && (
                                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                                        No collaborators found in CRM.
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                                <TabsContent value="email" className="space-y-4 pt-4">
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
                                </TabsContent>
                            </Tabs>

                            <div className="border-t pt-4 space-y-4">
                                <div className="grid gap-2">
                                    <Label>Payment Structure</Label>
                                    <Select
                                        defaultValue="revenue_share"
                                        onValueChange={(v: any) => setValue("paymentType", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="revenue_share">Revenue Share (%)</SelectItem>
                                            <SelectItem value="hourly">Hourly Rate ($/h)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentType === "revenue_share" ? (
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
                                        <p className="text-xs text-muted-foreground">
                                            Percentage of project revenue allocated to this collaborator.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="hourlyRate">Hourly Rate ($/h)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                            <Input
                                                id="hourlyRate"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="50.00"
                                                className="pl-7"
                                                {...register("hourlyRate", { valueAsNumber: true })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Fixed amount paid for every hour tracked on this project.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t">
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
