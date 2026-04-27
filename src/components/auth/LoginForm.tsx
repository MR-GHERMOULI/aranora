'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { login } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Mail,
    Lock,
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
} from 'lucide-react'

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const err = params.get('error')
            if (err === 'gmail_only') {
                setError('Only Gmail addresses (@gmail.com) are allowed to sign in.')
            } else if (err === 'auth') {
                setError('Authentication failed. Please try again.')
            }
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        setError(null)
        
        const email = formData.get('email') as string
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError('Only Gmail addresses (@gmail.com) are allowed to sign in.')
            return
        }

        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    async function handleGoogleSignIn() {
        setIsGoogleLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/api/auth/callback`,
                },
            })
            if (error) {
                setError('Google sign-in is currently unavailable. Please use email instead.')
                setIsGoogleLoading(false)
            }
        } catch {
            setError('Google sign-in failed. Please try again.')
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Welcome back
                </h1>
                <p className="text-muted-foreground">
                    Sign in to manage your freelance business
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Google Sign-In */}
            <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium border-border hover:bg-muted/50 transition-all duration-200 hover:shadow-md group"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                )}
                Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">
                        or sign in with email
                    </span>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground text-sm font-medium">
                        Email address
                    </Label>
                    <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground text-sm font-medium">
                            Password
                        </Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-brand-primary hover:text-brand-primary-light font-medium transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="login-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-11 pr-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-light text-white font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.01]"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                    href="/signup"
                    className="font-semibold text-brand-primary hover:text-brand-primary-light transition-colors"
                >
                    Create one free
                </Link>
            </p>
        </div>
    )
}
