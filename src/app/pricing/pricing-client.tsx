"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Sparkles, Star, ArrowRight, Zap, ChevronRight, Globe, TrendingUp, DollarSign, Shield, Clock, Briefcase, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { Footer } from "@/components/layout/footer";

export interface PricingPageData {
    hero_title: string
    hero_subtitle: string
    monthly_price: number
    annual_price: number
    features: string[]
    faqs: { question: string; answer: string }[]
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
            >
                <span className="font-semibold text-foreground text-[15px]">{question}</span>
                <div className={`text-muted-foreground ml-4 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted'}`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
            </button>
            <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
            >
                <p className="text-muted-foreground text-[15px] leading-relaxed pr-8">{answer}</p>
            </div>
        </div>
    );
}

function PricingContent({ data }: { data: PricingPageData }) {
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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col pt-16">
            {/* ========== NAVIGATION ========== */}
            <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                    <svg
                                        className="h-5 w-5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold text-brand-primary tracking-tight">
                                    Aranora
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link
                                href="/#features"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Features
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-sm text-foreground transition-colors font-semibold"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/#testimonials"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Testimonials
                            </Link>
                            <Link
                                href="/#affiliates"
                                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors"
                            >
                                Affiliates
                            </Link>
                            <Link
                                href="/blog"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Blog
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                asChild
                                className="hidden sm:inline-flex"
                            >
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button
                                asChild
                                className="bg-brand-primary hover:bg-brand-primary-light shadow-lg shadow-brand-primary/20 transition-all hover:shadow-brand-primary/30"
                            >
                                <Link href="/signup">
                                    Get Started Free
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-pulse-glow" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    {/* Trial expired banner */}
                    {expired && (
                        <FadeIn className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center max-w-4xl mx-auto shadow-md">
                            <p className="text-amber-700 dark:text-amber-200 font-medium flex items-center justify-center gap-2">
                                <Clock className="h-5 w-5" /> Your free trial has ended. Choose a plan to continue using Aranora.
                            </p>
                        </FadeIn>
                    )}

                    {canceled && (
                        <FadeIn className="mb-8 bg-muted border border-border rounded-xl p-4 text-center max-w-4xl mx-auto">
                            <p className="text-muted-foreground font-medium">
                                Checkout was canceled. You can try again whenever you&apos;re ready.
                            </p>
                        </FadeIn>
                    )}

                    {/* Hero */}
                    <FadeIn delay={0.1} className="text-center mb-16 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-semibold mb-6">
                            <Sparkles className="h-4 w-4" />
                            First Month Free
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight leading-[1.1]">
                            {data.hero_title.includes('transparent pricing') ? (
                                <>
                                    {data.hero_title.split('transparent pricing')[0]}
                                    <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                                        transparent pricing
                                    </span>
                                </>
                            ) : (data.hero_title)}
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {data.hero_subtitle}
                        </p>
                    </FadeIn>

                    {/* Billing toggle */}
                    <FadeIn delay={0.2} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <div className="flex items-center gap-4">
                            <span className={`text-base font-semibold transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background ${isAnnual ? 'bg-brand-primary' : 'bg-muted-foreground/30'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isAnnual ? 'translate-x-[34px]' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className={`text-base font-semibold transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Annual
                            </span>
                        </div>
                        {isAnnual && (
                            <ScaleIn delay={0.3}>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-3.5 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                                    <Zap className="h-3.5 w-3.5" />
                                    Save ${(data.monthly_price * 12) - data.annual_price}/year
                                </span>
                            </ScaleIn>
                        )}
                    </FadeIn>

                    {/* Pricing cards */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                        {/* Monthly card */}
                        <ScaleIn delay={0.2} className={`relative rounded-3xl border transition-all duration-300 ${!isAnnual
                            ? 'border-brand-primary/50 bg-card shadow-2xl shadow-brand-primary/10 scale-[1.02] z-10'
                            : 'border-border bg-card hover:border-brand-primary/30 hover:shadow-lg'
                            }`}>
                            <div className="p-8 sm:p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                        <Star className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">Monthly</h3>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-extrabold text-foreground">${data.monthly_price}</span>
                                        <span className="text-muted-foreground text-lg font-medium">/month</span>
                                    </div>
                                    <p className="text-muted-foreground mt-3 text-sm">Billed monthly. Cancel anytime seamlessly.</p>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => handleSubscribe('monthly')}
                                    disabled={loading !== null}
                                    className={`w-full py-6 text-base rounded-xl font-bold transition-all duration-200 group flex items-center justify-center gap-2 ${!isAnnual
                                        ? 'bg-brand-primary hover:bg-brand-primary-light text-white shadow-xl shadow-brand-primary/25'
                                        : 'bg-muted hover:bg-brand-primary hover:text-white border border-border hover:border-brand-primary text-foreground'
                                        }`}
                                >
                                    {loading === 'monthly' ? (
                                        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : (
                                        <>Get Started <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </Button>
                            </div>
                        </ScaleIn>

                        {/* Annual card */}
                        <ScaleIn delay={0.3} className={`relative rounded-3xl border-2 transition-all duration-300 ${isAnnual
                            ? 'border-brand-primary/50 bg-card shadow-2xl shadow-brand-primary/15 scale-[1.02] z-10'
                            : 'border-border bg-card hover:border-brand-primary/30 hover:shadow-lg'
                            }`}>
                            {isAnnual && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-5 py-2 rounded-full shadow-lg shadow-brand-primary/25">
                                        <Zap className="h-3.5 w-3.5" />
                                        BEST VALUE — 2 MONTHS FREE
                                    </span>
                                </div>
                            )}

                            <div className="p-8 sm:p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-brand-secondary/10 text-brand-secondary-dark dark:text-brand-secondary flex items-center justify-center">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">Annual</h3>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-extrabold text-foreground">${data.annual_price}</span>
                                        <span className="text-muted-foreground text-lg font-medium">/year</span>
                                    </div>
                                    <p className="text-muted-foreground mt-3 text-sm flex items-center gap-2">
                                        <span className="line-through decoration-muted-foreground/50">${data.monthly_price * 12}/year</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                                            Save {Math.round(((data.monthly_price * 12 - data.annual_price) / (data.monthly_price * 12)) * 100)}%
                                        </span>
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => handleSubscribe('yearly')}
                                    disabled={loading !== null}
                                    className={`w-full py-6 text-base rounded-xl font-bold transition-all duration-200 group flex items-center justify-center gap-2 ${isAnnual
                                        ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white shadow-xl shadow-brand-primary/25'
                                        : 'bg-muted hover:bg-gradient-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white border border-border text-foreground hover:border-transparent'
                                        }`}
                                >
                                    {loading === 'yearly' ? (
                                        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : (
                                        <>Get Started <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </Button>
                            </div>
                        </ScaleIn>
                    </div>

                    {/* Features checklist */}
                    <FadeIn delay={0.4} className="mt-8 mb-24 max-w-4xl mx-auto bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-sm">
                        <div className="text-center mb-10">
                            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                Everything included in your plan
                            </h3>
                            <p className="text-muted-foreground">Unlock the full potential of your freelance business with all tools accessible without limits.</p>
                        </div>
                        <StaggerContainer className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                            {data.features.map((feature, i) => (
                                <StaggerItem key={i} className="flex items-center gap-4 text-foreground p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                                    </div>
                                    <span className="text-base font-medium">{feature}</span>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </FadeIn>

                    {/* FAQ */}
                    <FadeIn delay={0.5} className="max-w-3xl mx-auto mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
                            <p className="text-muted-foreground">Everything you need to know about Aranora's pricing and billing.</p>
                        </div>
                        <div className="space-y-4">
                            {data.faqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </FadeIn>

                    {/* CTA */}
                    <FadeIn delay={0.6} className="mt-16 text-center max-w-2xl mx-auto bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 rounded-3xl p-10">
                        <h3 className="text-2xl font-bold text-foreground mb-4">Not convinced yet?</h3>
                        <p className="text-muted-foreground mb-8">
                            Start your 30-day free trial and experience the difference — no credit card needed. Join leading freelancers today.
                        </p>
                        <Button asChild size="lg" className="px-8 py-6 text-base shadow-xl group bg-brand-primary hover:bg-brand-primary-light">
                            <Link href="/signup">
                                Start Your Free Trial <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </FadeIn>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export function PricingPageClientWrap({ data }: { data: PricingPageData }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col pt-16">
                <main className="flex-1 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-pulse-glow" />
                        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
                    </div>
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                </main>
            </div>
        }>
            <PricingContent data={data} />
        </Suspense>
    );
}
