'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { signup } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { countries } from '@/lib/countries'
import {
    Mail,
    Lock,
    User,
    Phone,
    Globe,
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Search,
    Tag,
} from 'lucide-react'

function getPasswordStrength(password: string): {
    score: number
    label: string
    color: string
    barColor: string
} {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 1) return { score: 1, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' }
    if (score === 2) return { score: 2, label: 'Fair', color: 'text-orange-500', barColor: 'bg-orange-500' }
    if (score === 3) return { score: 3, label: 'Good', color: 'text-yellow-500', barColor: 'bg-yellow-500' }
    if (score >= 4) return { score: 4, label: 'Strong', color: 'text-brand-secondary-dark dark:text-brand-secondary', barColor: 'bg-brand-secondary-dark dark:bg-brand-secondary' }
    return { score: 0, label: '', color: '', barColor: '' }
}

export default function SignupForm({ promo }: { promo?: string }) {
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPromo, setShowPromo] = useState(!!promo)
    const [countrySearch, setCountrySearch] = useState('')
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState('')
    const [refCode, setRefCode] = useState('')

    const strength = password.length > 0 ? getPasswordStrength(password) : null

    const filteredCountries = useMemo(() => {
        const query = countrySearch.toLowerCase()
        if (!query) return countries

        return countries
            .filter(c => c.toLowerCase().includes(query))
            .sort((a, b) => {
                const aStarts = a.toLowerCase().startsWith(query)
                const bStarts = b.toLowerCase().startsWith(query)
                if (aStarts && !bStarts) return -1
                if (!aStarts && bStarts) return 1
                return a.localeCompare(b)
            })
    }, [countrySearch])

    // Read affiliate referral cookie on mount
    useEffect(() => {
        try {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const refCookie = cookies.find(c => c.startsWith('aranora_ref_code='));
            if (refCookie) {
                setRefCode(refCookie.split('=')[1]);
            }
        } catch { /* ignore */ }
    }, []);

    // Auto-detect country on mount
    useEffect(() => {
        if (!selectedCountry) {
            fetch('https://get.geojs.io/v1/ip/geo.json')
                .then(res => res.json())
                .then(data => {
                    if (data && data.country) {
                        const matchedCountry = countries.find(
                            c => c.toLowerCase() === data.country.toLowerCase()
                        )
                        if (matchedCountry) {
                            setSelectedCountry(matchedCountry)
                        }
                    }
                })
                .catch(err => console.warn('Failed to auto-detect country:', err))
        }
    }, [selectedCountry])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const err = params.get('error')
            if (err === 'gmail_only') {
                setError('Registration is strictly limited to Gmail addresses (@gmail.com) only.')
            } else if (err === 'auth') {
                setError('Google sign-up failed. Please try again.')
            }
        }
    }, [])

    async function handleSubmit(formData: FormData) {
        setError(null)

        // Client-side validation
        const email = formData.get('email') as string
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError('Registration is strictly limited to Gmail addresses (@gmail.com) only.')
            return
        }

        const pw = formData.get('password') as string
        if (pw.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        // Inject selected country
        formData.set('country', selectedCountry)

        startTransition(async () => {
            const result = await signup(formData)
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
                setError('Google sign-up is currently unavailable. Please use email instead.')
                setIsGoogleLoading(false)
            }
        } catch {
            setError('Google sign-up failed. Please try again.')
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Create your account
                </h1>
                <p className="text-muted-foreground">
                    {promo
                        ? 'Sign up to claim your free access!'
                        : 'Start your 30-day free trial — no credit card required'}
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Google Sign-Up */}
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
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
                        or sign up with email
                    </span>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="space-y-4">
                {promo && <input type="hidden" name="promoCode" value={promo} />}
                {refCode && <input type="hidden" name="refCode" value={refCode} />}

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="signup-fullName" className="text-foreground text-sm font-medium">
                        Full Name
                    </Label>
                    <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="signup-fullName"
                            name="fullName"
                            type="text"
                            placeholder="John Doe"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground text-sm font-medium">
                        Email address
                    </Label>
                    <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-foreground text-sm font-medium">
                        Phone Number
                    </Label>
                    <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="signup-phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Country — Searchable Dropdown */}
                <div className="space-y-2">
                    <Label htmlFor="signup-country" className="text-foreground text-sm font-medium">
                        Country
                    </Label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className="flex h-12 w-full items-center rounded-md border border-input bg-muted/30 pl-11 pr-10 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/50 transition-all duration-200"
                            disabled={isPending}
                        >
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className={selectedCountry ? 'text-foreground' : 'text-muted-foreground'}>
                                {selectedCountry || 'Select your country'}
                            </span>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </button>
                        <input type="hidden" name="country" value={selectedCountry} />

                        {countryDropdownOpen && (
                            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl shadow-black/10 animate-slide-up overflow-hidden">
                                <div className="p-2 border-b border-border">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search countries..."
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/30 rounded-lg border-0 outline-none focus:bg-background text-foreground placeholder:text-muted-foreground"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {filteredCountries.length === 0 ? (
                                        <div className="p-3 text-sm text-muted-foreground text-center">
                                            No countries found
                                        </div>
                                    ) : (
                                        filteredCountries.map((country) => (
                                            <button
                                                key={country}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCountry(country)
                                                    setCountryDropdownOpen(false)
                                                    setCountrySearch('')
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${selectedCountry === country
                                                        ? 'bg-brand-primary/10 text-brand-primary font-medium'
                                                        : 'text-foreground'
                                                    }`}
                                            >
                                                {country}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground text-sm font-medium">
                        Password
                    </Label>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            id="signup-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-11 pr-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                            required
                            disabled={isPending}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
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

                    {/* Password Strength Indicator */}
                    {strength && (
                        <div className="space-y-1.5 animate-slide-up">
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${level <= strength.score
                                                ? strength.barColor
                                                : 'bg-muted'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className={`text-xs font-medium ${strength.color}`}>
                                {strength.label} password
                            </p>
                        </div>
                    )}
                    {!strength && (
                        <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters
                        </p>
                    )}
                </div>

                {/* Promo Code */}
                {!promo && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowPromo(!showPromo)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-brand-primary transition-colors font-medium"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            {showPromo ? 'Hide promo code' : 'Have a promo code?'}
                        </button>
                        {showPromo && (
                            <div className="mt-2 animate-slide-up">
                                <div className="relative group">
                                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-primary transition-colors" />
                                    <Input
                                        name="promoCode"
                                        type="text"
                                        placeholder="Enter promo code"
                                        className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-all duration-200"
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Terms Agreement */}
                <p className="text-xs text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-brand-primary hover:underline font-medium">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-brand-primary hover:underline font-medium">
                        Privacy Policy
                    </Link>
                </p>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-light text-white font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.01]"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Benefits */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-2.5 border border-border/50">
                {[
                    '30-day free trial — no credit card needed',
                    'Unlimited projects & clients',
                    'Smart invoicing & contracts',
                ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-brand-secondary-dark dark:text-brand-secondary flex-shrink-0" />
                        {benefit}
                    </div>
                ))}
            </div>

            {/* Sign in link */}
            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-semibold text-brand-primary hover:text-brand-primary-light transition-colors"
                >
                    Sign in
                </Link>
            </p>
        </div>
    )
}
