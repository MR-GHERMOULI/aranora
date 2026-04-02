'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Sparkles, Star, ArrowRight, Crown, Zap } from 'lucide-react';

const features = [
    'Unlimited projects & clients',
    'Smart invoicing & contracts',
    'Time tracking & reports',
    'Team collaboration',
    'Calendar & task management',
    'File management',
    'Client portal with progress sharing',
    'PDF contract generation',
    'Priority support',
];

function PricingContent() {
    const [isAnnual, setIsAnnual] = useState(true);
    const [loading, setLoading] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const expired = searchParams.get('expired') === 'true';
    const canceled = searchParams.get('canceled') === 'true';

    const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
        setLoading(planType);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else if (res.status === 401) {
                window.location.href = '/signup';
            } else {
                alert('Failed to start checkout. Please try again.');
            }
        } catch {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                {/* Trial expired banner */}
                {expired && (
                    <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <p className="text-amber-700 dark:text-amber-200 font-medium">
                            ⏰ Your free trial has ended. Choose a plan to continue using Aranora.
                        </p>
                    </div>
                )}

                {canceled && (
                    <div className="mb-8 bg-muted border border-border rounded-xl p-4 text-center">
                        <p className="text-muted-foreground">
                            Checkout was canceled. You can try again whenever you&apos;re ready.
                        </p>
                    </div>
                )}

                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-6">
                        <Sparkles className="h-4 w-4" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
                        One plan, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">everything included</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Start with a 30-day free trial. No credit card required. Upgrade when you&apos;re ready.
                    </p>
                </div>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isAnnual ? 'bg-indigo-600' : 'bg-muted-foreground/30'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Annual
                    </span>
                    {isAnnual && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-white px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                            <Zap className="h-3 w-3" />
                            Save $38
                        </span>
                    )}
                </div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Monthly card */}
                    <div className={`relative rounded-2xl border transition-all duration-300 ${!isAnnual
                        ? 'border-indigo-500/50 bg-card shadow-xl shadow-indigo-500/10 scale-[1.02]'
                        : 'border-border bg-card/50 hover:border-border'
                        }`}>
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-indigo-500/10">
                                    <Star className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Monthly</h3>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-foreground">$19</span>
                                    <span className="text-muted-foreground text-lg">/month</span>
                                </div>
                                <p className="text-muted-foreground mt-2 text-sm">Billed monthly. Cancel anytime.</p>
                            </div>

                            <button
                                onClick={() => handleSubscribe('monthly')}
                                disabled={loading !== null}
                                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${!isAnnual
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading === 'monthly' ? (
                                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                    <>Get Started <ArrowRight className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Annual card */}
                    <div className={`relative rounded-2xl border transition-all duration-300 ${isAnnual
                        ? 'border-indigo-500/50 bg-card shadow-xl shadow-indigo-500/10 scale-[1.02]'
                        : 'border-border bg-card/50 hover:border-border'
                        }`}>
                        {isAnnual && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full shadow-lg">
                                    <Crown className="h-3 w-3" />
                                    BEST VALUE
                                </span>
                            </div>
                        )}

                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-purple-500/10">
                                    <Crown className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Annual</h3>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-foreground">$190</span>
                                    <span className="text-muted-foreground text-lg">/year</span>
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    <span className="line-through">$228/year</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-medium">2 months free!</span>
                                </p>
                            </div>

                            <button
                                onClick={() => handleSubscribe('yearly')}
                                disabled={loading !== null}
                                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isAnnual
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading === 'yearly' ? (
                                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                    <>Get Started <ArrowRight className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-16 max-w-2xl mx-auto">
                    <h3 className="text-center text-lg font-semibold text-foreground mb-8">
                        Everything included in both plans
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-foreground">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-muted-foreground text-sm mb-4">
                        Not sure yet? Start your 30-day free trial — no credit card needed.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors border border-border"
                    >
                        Start Free Trial <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
            <PricingContent />
        </Suspense>
    );
}
