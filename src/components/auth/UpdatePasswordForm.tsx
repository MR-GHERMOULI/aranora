'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, AlertCircle, KeyRound } from 'lucide-react'

export default function UpdatePasswordForm() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        setError(null)

        startTransition(async () => {
            const result = await updatePassword(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                    <KeyRound className="h-7 w-7 text-brand-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Set new password
                </h1>
                <p className="text-muted-foreground">
                    Please enter your new password below.
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form action={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground text-sm font-medium">
                        New Password
                    </Label>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                            minLength={8}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 ml-1">Must be at least 8 characters long</p>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-light text-white font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.01]"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update Password'
                    )}
                </Button>
            </form>
        </div>
    )
}
