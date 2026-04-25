'use client';

import { useState } from 'react';
import { Gift, Clock, ArrowRight, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useEffect } from 'react';

interface PromoPageClientProps {
    code: string;
    promo: {
        code: string;
        free_months: number;
        is_active: boolean;
        times_used: number;
        max_uses: number;
        expires_at: string | null;
    } | null;
}

export function PromoPageClient({ code, promo }: PromoPageClientProps) {
    const isValid = promo && promo.is_active && promo.times_used < promo.max_uses;
    const isExpired = promo?.expires_at && new Date(promo.expires_at) < new Date();

    const [branding, setBranding] = useState<{site_name: string, logo_url: string | null}>({
        site_name: 'Aranora',
        logo_url: null
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'branding')
                .single();
            
            if (data?.value) {
                setBranding({
                    site_name: data.value.site_name || 'Aranora',
                    logo_url: data.value.logo_url || null
                });
            }
        };
        fetchSettings();
    }, []);

    if (!promo || !isValid || isExpired) {
        return (
            <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 flex items-center justify-center min-h-[60vh]">
                <div className="max-w-md w-full text-center">
                    <div className="p-4 rounded-full bg-red-500/10 w-fit mx-auto mb-6">
                        <XCircle className="h-12 w-12 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-3">Invalid or Expired Link</h1>
                    <p className="text-muted-foreground mb-8">
                        This invitation link is no longer valid. It may have already been used or expired.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-medium text-sm transition-colors"
                    >
                        Sign up with free trial instead <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </main>
        );
    }

    const freeMonthsLabel = promo.free_months === 12 ? '1 year' : '6 months';

    return (
        <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 relative">
            {/* Back Button */}
            <div className="mb-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Back to Home
                </Link>
            </div>

            <div className="flex items-center justify-center">
                <div className="relative max-w-lg w-full">
                    {/* Gift badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium mb-6">
                            <Gift className="h-4 w-4" />
                            Special Invitation
                        </div>
                    </div>

                    {/* Main card */}
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-2xl relative overflow-hidden">
                        {/* Gradient effect */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>

                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-primary/20 overflow-hidden p-0.5">
                                {branding.logo_url ? (
                                    <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl bg-white" />
                                ) : (
                                    <Gift className="h-10 w-10 text-white" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                You&apos;re Invited!
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Get <span className="text-brand-primary font-semibold">{freeMonthsLabel} free</span> on {branding.site_name}
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3 mb-8">
                            {[
                                `${freeMonthsLabel} of full access — no credit card needed`,
                                'Unlimited projects, clients & invoicing',
                                'All premium features included',
                            ].map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-muted-foreground text-sm">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="space-y-3">
                            <Link
                                href={`/signup?promo=${code}`}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-primary/25"
                            >
                                Create Free Account <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href={`/login?promo=${code}`}
                                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-muted/50 hover:bg-muted text-foreground font-medium text-sm transition-colors border border-border"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>

                        {/* Expiry note */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                            <Clock className="h-3 w-3" />
                            <span>This is a single-use invitation link</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
