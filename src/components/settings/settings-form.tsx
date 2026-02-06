"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/app/(dashboard)/settings/actions"
import { useRouter } from "next/navigation"

const profileSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    companyName: z.string().optional(),
    companyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    address: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface SettingsFormProps {
    profile: {
        id: string;
        username?: string;
        full_name: string;
        company_name: string;
        company_email: string;
        address: string;
        currency: string;
    }
}

export function SettingsForm({ profile }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: profile.username || "",
            fullName: profile.full_name,
            companyName: profile.company_name,
            companyEmail: profile.company_email,
            address: profile.address,
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        setLoading(true)
        setServerError(null)
        try {
            const formData = new FormData()
            formData.append("username", data.username)
            formData.append("fullName", data.fullName)
            if (data.companyName) formData.append("companyName", data.companyName)
            if (data.companyEmail) formData.append("companyEmail", data.companyEmail)
            if (data.address) formData.append("address", data.address)

            await updateProfile(formData)
            alert("Profile updated successfully")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            setServerError(error.message || "Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
            {serverError && (
                <div className="bg-destructive/15 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                    {serverError}
                </div>
            )}

            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="username">Username (@handle)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                        <Input
                            id="username"
                            placeholder="username"
                            className="pl-7"
                            {...register("username")}
                        />
                    </div>
                    {errors.username ? (
                        <p className="text-sm text-red-500">{errors.username.message}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Your unique public handle. 3-20 characters, alphanumeric and underscores.
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register("fullName")}
                    />
                    {errors.fullName && (
                        <p className="text-sm text-red-500">{errors.fullName.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        placeholder="Acme Inc."
                        {...register("companyName")}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                        id="companyEmail"
                        type="email"
                        placeholder="contact@acme.com"
                        {...register("companyEmail")}
                    />
                    {errors.companyEmail && (
                        <p className="text-sm text-red-500">{errors.companyEmail.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                        id="address"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="123 Business St, City, Country"
                        {...register("address")}
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    )
}
