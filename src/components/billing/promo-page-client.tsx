'use client';

import { useState } from 'react';
import { Gift, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

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

    if (!promo || !isValid || isExpired) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="p-4 rounded-full bg-red-500/10 w-fit mx-auto mb-6">
                        <XCircle className="h-12 w-12 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Invalid or Expired Link</h1>
                    <p className="text-slate-400 mb-8">
                        This invitation link is no longer valid. It may have already been used or expired.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                    >
                        Sign up with free trial instead <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const freeMonthsLabel = promo.free_months === 12 ? '1 year' : '6 months';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
            {/* Decorative */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-lg w-full">
                {/* Gift badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium mb-6">
                        <Gift className="h-4 w-4" />
                        Special Invitation
                    </div>
                </div>

                {/* Main card */}
                <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                            <Gift className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">
                            You&apos;re Invited!
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Get <span className="text-indigo-400 font-semibold">{freeMonthsLabel} free</span> on Aranora
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
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-slate-300 text-sm">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="space-y-3">
                        <Link
                            href={`/signup?promo=${code}`}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25"
                        >
                            Create Free Account <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href={`/login?promo=${code}`}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors border border-slate-600/50"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>

                    {/* Expiry note */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>This is a single-use invitation link</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
