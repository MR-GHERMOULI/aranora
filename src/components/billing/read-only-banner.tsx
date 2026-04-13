'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscriptionStatus } from '@/components/providers/subscription-context';

/**
 * A persistent banner displayed across the dashboard when a user's
 * trial or subscription has expired. Clearly communicates they are
 * in view-only mode and prompts them to upgrade.
 */
export function ReadOnlyBanner() {
    const { isReadOnly, subscriptionStatus, trialDaysRemaining } = useSubscriptionStatus();

    if (!isReadOnly) return null;

    const isExpiredTrial = subscriptionStatus === 'expired' || subscriptionStatus === 'trialing';
    const title = isExpiredTrial
        ? 'Your free trial has ended'
        : 'Your subscription has expired';
    const subtitle = 'You\'re in view-only mode. Upgrade to continue creating, editing, and managing your work.';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative overflow-hidden"
        >
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-amber-500/20">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: message */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Lock className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground leading-tight">
                                    {title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Right: CTA */}
                        <Link
                            href="/pricing"
                            className="group flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Sparkles className="h-4 w-4" />
                            Upgrade Now
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Animated shimmer accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent animate-shimmer" />
        </motion.div>
    );
}
