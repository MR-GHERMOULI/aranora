'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Mail,
    Lock,
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Send,
} from 'lucide-react'

export default function ForgotPasswordForm() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            const result = await resetPassword(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success) {
                setSuccess(true)
            }
        })
    }

    if (success) {
        return (
            <div className="space-y-8 animate-slide-up">
                <div className="text-center space-y-4">
                    {/* Animated check icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-brand-secondary/15 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-brand-secondary/25 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-brand-secondary-dark dark:text-brand-secondary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Check your inbox
                    </h1>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        We&apos;ve sent a password reset link to your email address. 
                        Please check your inbox and follow the instructions.
                    </p>
                </div>

                <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-primary" />
                        <span>
                            Didn&apos;t receive the email? Check your spam folder or{' '}
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-brand-primary hover:underline font-medium"
                            >
                                try again
                            </button>
                        </span>
                    </div>
                </div>

                <p className="text-center">
                    <Link
                        href="/login"
                        className="text-sm text-muted-foreground hover:text-brand-primary inline-flex items-center gap-2 font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-7 w-7 text-brand-primary" />
                </div>

                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Reset your password
                </h1>
                <p className="text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            <form action={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-foreground text-sm font-medium">
                        Email address
                    </Label>
                    <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="reset-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-light text-white font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.01]"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending reset link...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Reset Link
                        </>
                    )}
                </Button>
            </form>

            {/* Back to login */}
            <p className="text-center">
                <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-brand-primary inline-flex items-center gap-2 font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </p>
        </div>
    )
}

