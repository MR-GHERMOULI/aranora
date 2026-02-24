"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile, updateLogo } from "@/app/(dashboard)/settings/actions"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

const profileSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    companyName: z.string().optional(),
    companyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    address: z.string().optional(),
    defaultPaperSize: z.enum(["A4", "LETTER"]),
    defaultTaxRate: z.number().min(0).max(100),
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
        logo_url: string | null;
        default_paper_size: string;
        default_tax_rate: number;
    }
}

export function SettingsForm({ profile }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [logoLoading, setLogoLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo_url)
    const logoInputRef = useRef<HTMLInputElement>(null)
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
            defaultPaperSize: (profile.default_paper_size as "A4" | "LETTER") || "A4",
            defaultTaxRate: profile.default_tax_rate || 0,
        },
    })

    async function handleLogoUpload(file: File) {
        if (file.size > 2 * 1024 * 1024) {
            setServerError("File size must be less than 2MB.");
            return;
        }

        setLogoLoading(true)
        setServerError(null)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}-logo-${Date.now()}.${fileExt}`

            const { error: uploadError, data } = await supabase.storage
                .from('logos')
                .upload(fileName, file, { upsert: true })

            if (uploadError) {
                // If bucket doesn't exist, try avatars bucket
                const { error: avatarUploadError, data: avatarData } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, file, { upsert: true })

                if (avatarUploadError) throw avatarUploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                await updateLogo(publicUrl)
                setLogoUrl(publicUrl)
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('logos')
                    .getPublicUrl(fileName)

                await updateLogo(publicUrl)
                setLogoUrl(publicUrl)
            }

            router.refresh()
        } catch (error: any) {
            console.error('Logo upload error:', error)
            setServerError(error.message || 'Failed to upload logo')
        } finally {
            setLogoLoading(false)
        }
    }

    async function handleLogoRemove() {
        setLogoLoading(true)
        try {
            await updateLogo(null)
            setLogoUrl(null)
            router.refresh()
        } catch (error: any) {
            setServerError(error.message || 'Failed to remove logo')
        } finally {
            setLogoLoading(false)
        }
    }

    async function onSubmit(data: ProfileFormValues) {
        setLoading(true)
        setServerError(null)
        try {
            const formData = new FormData()
            formData.append("username", data.username)
            formData.append("fullName", data.fullName)
            formData.append("companyName", data.companyName || "")
            formData.append("companyEmail", data.companyEmail || "")
            formData.append("address", data.address || "")
            formData.append("defaultPaperSize", data.defaultPaperSize)
            formData.append("defaultTaxRate", String(data.defaultTaxRate))

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
        <div className="space-y-8 max-w-2xl">
            {/* Logo Upload Section */}
            <div className="space-y-4 pb-6 border-b">
                <Label className="text-lg font-semibold">Company Logo</Label>
                <p className="text-sm text-muted-foreground">
                    Upload your company logo for invoices and documents. (Max 2MB. Recommended: 512x512px. PNG, JPG, or WEBP)
                </p>
                <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                        {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt="Company Logo"
                                fill
                                className="object-contain p-2"
                            />
                        ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleLogoUpload(file)
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={logoLoading}
                        >
                            {logoLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        {logoUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleLogoRemove}
                                disabled={logoLoading}
                                className="text-destructive hover:text-destructive"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                        <div className="grid gap-2">
                            <Label htmlFor="defaultPaperSize">Default Invoice Paper Size</Label>
                            <select
                                id="defaultPaperSize"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...register("defaultPaperSize")}
                            >
                                <option value="A4">A4 (210 × 297 mm)</option>
                                <option value="LETTER">Letter (8.5 × 11 in)</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                            <Input
                                id="defaultTaxRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register("defaultTaxRate", { valueAsNumber: true })}
                            />
                            {errors.defaultTaxRate && (
                                <p className="text-sm text-red-500">{errors.defaultTaxRate.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
        </div>
    )
}
