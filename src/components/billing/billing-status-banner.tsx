'use client';

import { useEffect, useState } from 'react';
import { Clock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface BillingStatusBannerProps {
    trialDaysRemaining: number;
    status: string;
}

export function BillingStatusBanner({ trialDaysRemaining, status }: BillingStatusBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    // Only show for trialing users with 7 or fewer days remaining
    if (dismissed || status !== 'trialing' || trialDaysRemaining > 7) {
        return null;
    }

    const urgency = trialDaysRemaining <= 2;

    return (
        <div className={`sticky top-0 z-30 px-4 py-3 flex items-center justify-between gap-4 ${urgency
                ? 'bg-gradient-to-r from-red-600/90 to-orange-600/90 text-white'
                : 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white'
            }`}>
            <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                    {trialDaysRemaining === 0
                        ? 'Your free trial expires today!'
                        : `Your free trial ends in ${trialDaysRemaining} day${trialDaysRemaining > 1 ? 's' : ''}.`
                    }
                </span>
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                >
                    Upgrade now <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded hover:bg-white/20 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
