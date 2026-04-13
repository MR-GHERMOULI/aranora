'use client';

import React, { createContext, useContext } from 'react';

export interface SubscriptionStatus {
    /** True when the user's trial/subscription has expired — UI should disable write actions */
    isReadOnly: boolean;
    /** Current subscription status: trialing, active, past_due, canceled, expired */
    subscriptionStatus: string;
    /** Days remaining in trial (0 if trial is over or user is on a paid plan) */
    trialDaysRemaining: number;
}

const SubscriptionContext = createContext<SubscriptionStatus>({
    isReadOnly: false,
    subscriptionStatus: 'active',
    trialDaysRemaining: 0,
});

export function SubscriptionStatusProvider({
    children,
    value,
}: {
    children: React.ReactNode;
    value: SubscriptionStatus;
}) {
    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

/**
 * Hook to access subscription status from any client component.
 * 
 * ```tsx
 * const { isReadOnly } = useSubscriptionStatus();
 * ```
 */
export function useSubscriptionStatus(): SubscriptionStatus {
    return useContext(SubscriptionContext);
}
