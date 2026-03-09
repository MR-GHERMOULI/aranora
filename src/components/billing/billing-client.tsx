'use client';

import { useState } from 'react';
import { CreditCard, Calendar, Crown, ExternalLink, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { UserBillingInfo } from '@/lib/billing';

interface BillingClientProps {
    billing: UserBillingInfo;
}

export function BillingClient({ billing }: BillingClientProps) {
    const [portalLoading, setPortalLoading] = useState(false);

    const handleManageBilling = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            alert('Failed to open billing portal');
        } finally {
            setPortalLoading(false);
        }
    };

    const statusConfig = {
        trialing: {
            label: 'Free Trial',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20',
            icon: Clock,
            description: `${billing.trialDaysRemaining} days remaining`,
        },
        active: {
            label: 'Active',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20',
            icon: CheckCircle2,
            description: billing.planType === 'yearly' ? 'Annual Plan' : 'Monthly Plan',
        },
        past_due: {
            label: 'Past Due',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10 border-amber-500/20',
            icon: AlertTriangle,
            description: 'Payment required',
        },
        canceled: {
            label: 'Canceled',
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/10 border-slate-500/20',
            icon: AlertTriangle,
            description: 'Access until period end',
        },
        expired: {
            label: 'Expired',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10 border-red-500/20',
            icon: AlertTriangle,
            description: 'Subscription required',
        },
    };

    const config = statusConfig[billing.status];
    const StatusIcon = config.icon;

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
                    <p className="text-slate-400">Manage your subscription and billing details</p>
                </div>

                {/* Status card */}
                <div className={`rounded-2xl border p-6 mb-6 ${config.bgColor}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-800/50">
                                <StatusIcon className={`h-6 w-6 ${config.color}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold text-white">{config.label}</h2>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                                        {config.description}
                                    </span>
                                </div>
                                {billing.status === 'trialing' && (
                                    <p className="text-slate-400 text-sm mt-1">
                                        Your trial expires on {billing.trialEndsAt ? new Date(billing.trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </p>
                                )}
                                {billing.currentPeriodEnd && billing.status === 'active' && (
                                    <p className="text-slate-400 text-sm mt-1">
                                        Next billing date: {new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                )}
                                {billing.cancelAtPeriodEnd && (
                                    <p className="text-amber-400 text-sm mt-1">
                                        ⚠️ Subscription will cancel at the end of the current period
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {(billing.status === 'trialing' || billing.status === 'expired') && (
                        <a
                            href="/pricing"
                            className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Crown className="h-5 w-5 text-white" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Upgrade to Pro</p>
                                    <p className="text-indigo-200 text-xs">Starting at $19/month</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}

                    {billing.stripeCustomerId && (
                        <button
                            onClick={handleManageBilling}
                            disabled={portalLoading}
                            className="flex items-center justify-between p-5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors group text-left disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Manage Billing</p>
                                    <p className="text-slate-400 text-xs">Update payment, view invoices</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </button>
                    )}
                </div>

                {/* Plan details */}
                {billing.status === 'active' && (
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Current Plan
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Plan</span>
                                <span className="text-white text-sm font-medium">
                                    {billing.planType === 'yearly' ? 'Annual ($190/year)' : 'Monthly ($19/month)'}
                                </span>
                            </div>
                            {billing.currentPeriodEnd && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Current period ends</span>
                                    <span className="text-white text-sm font-medium">
                                        {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Auto-renewal</span>
                                <span className={`text-sm font-medium ${billing.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {billing.cancelAtPeriodEnd ? 'Canceled' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
