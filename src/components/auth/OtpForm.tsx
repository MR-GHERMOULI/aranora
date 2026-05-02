'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OtpForm({ maskedEmail }: { maskedEmail: string }) {
    const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [isVerifying, startVerifying] = useTransition()
    const [isResending, setIsResending] = useState(false)
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()

    // Start 60s cooldown on mount (code was already sent)
    useEffect(() => {
        setResendCooldown(60)
    }, [])

    // Countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [resendCooldown])

    function handleDigitChange(index: number, value: string) {
        const cleaned = value.replace(/\D/g, '').slice(-1)
        const next = [...digits]
        next[index] = cleaned
        setDigits(next)
        setError(null)

        if (cleaned && index < 5) {
            inputsRef.current[index + 1]?.focus()
        }

        // Auto-submit when all 6 filled
        if (cleaned && index === 5) {
            const full = [...next].join('')
            if (full.length === 6) {
                handleVerify([...next].join(''))
            }
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
        if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus()
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 6) {
            setDigits(pasted.split(''))
            inputsRef.current[5]?.focus()
            setTimeout(() => handleVerify(pasted), 50)
        }
    }

    async function handleVerify(code: string) {
        if (code.length !== 6) {
            setError('Please enter all 6 digits.')
            return
        }
        setError(null)

        startVerifying(async () => {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, rememberMe }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Verification failed. Please try again.')
                setDigits(Array(6).fill(''))
                inputsRef.current[0]?.focus()
                return
            }

            setSuccess(true)
            setTimeout(() => router.push('/dashboard'), 800)
        })
    }

    async function handleResend() {
        setIsResending(true)
        setError(null)
        setDigits(Array(6).fill(''))

        const res = await fetch('/api/auth/send-otp', { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error || 'Failed to resend code.')
        } else {
            setResendCooldown(60)
        }
        setIsResending(false)
        inputsRef.current[0]?.focus()
    }

    const code = digits.join('')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex justify-center mb-2">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-primary-light/10 border border-brand-primary/20 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-brand-primary" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Verify your identity
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    We sent a 6-digit code to<br />
                    <span className="font-semibold text-foreground">{maskedEmail}</span>
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm animate-slide-up">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span>Verified! Redirecting to dashboard…</span>
                </div>
            )}

            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { inputsRef.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        disabled={isVerifying || success}
                        className={`
                            w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 
                            bg-muted/30 text-foreground outline-none transition-all duration-200
                            focus:border-brand-primary focus:bg-background focus:shadow-[0_0_0_3px_rgba(30,58,95,0.12)]
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${digit ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-border'}
                            ${error ? 'border-destructive bg-destructive/5' : ''}
                        `}
                        autoFocus={i === 0}
                    />
                ))}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`
                        h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                        ${rememberMe
                            ? 'bg-brand-primary border-brand-primary'
                            : 'border-border group-hover:border-brand-primary/50'
                        }
                    `}
                >
                    {rememberMe && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <div>
                    <span className="text-sm font-medium text-foreground">Stay verified for 30 days</span>
                    <p className="text-xs text-muted-foreground">You won't be asked for a code on this device for the next month</p>
                </div>
            </label>

            {/* Verify Button */}
            <Button
                onClick={() => handleVerify(code)}
                disabled={code.length !== 6 || isVerifying || success}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-light text-white font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.01]"
            >
                {isVerifying ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying…
                    </>
                ) : success ? (
                    <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Verified!
                    </>
                ) : (
                    'Verify & Continue'
                )}
            </Button>

            {/* Resend */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isResending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend code'
                    }
                </button>
            </div>

            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground">
                🔒 This verification keeps your account secure.{' '}
                <br className="hidden sm:block" />
                The code expires in <strong>10 minutes</strong>.
            </p>
        </div>
    )
}
