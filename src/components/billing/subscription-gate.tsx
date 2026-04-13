'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useSubscriptionStatus } from '@/components/providers/subscription-context';

interface SubscriptionGateProps {
    children: React.ReactNode;
    /** Optional custom message shown in the tooltip */
    message?: string;
    /** If true, completely hides the children instead of disabling them */
    hideWhenLocked?: boolean;
    /** Optional: render a custom fallback when locked */
    fallback?: React.ReactNode;
}

/**
 * Wraps interactive elements (buttons, forms, dialogs) and disables
 * them when the user's subscription has expired.
 * 
 * Usage:
 * ```tsx
 * <SubscriptionGate>
 *   <Button onClick={handleCreate}>New Project</Button>
 * </SubscriptionGate>
 * ```
 */
export function SubscriptionGate({
    children,
    message = 'Upgrade your plan to use this feature',
    hideWhenLocked = false,
    fallback,
}: SubscriptionGateProps) {
    const { isReadOnly } = useSubscriptionStatus();

    if (!isReadOnly) {
        return <>{children}</>;
    }

    if (hideWhenLocked) {
        return fallback ? <>{fallback}</> : null;
    }

    return (
        <div className="relative group/gate inline-flex">
            {/* Disabled overlay */}
            <div className="pointer-events-none opacity-50 select-none [&_button]:cursor-not-allowed [&_a]:cursor-not-allowed [&_input]:cursor-not-allowed [&_textarea]:cursor-not-allowed [&_select]:cursor-not-allowed">
                {children}
            </div>

            {/* Lock icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/gate:opacity-100 transition-opacity duration-200 cursor-not-allowed">
                <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    {message}
                </div>
            </div>
        </div>
    );
}
