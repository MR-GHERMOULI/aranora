'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard,
    Calendar,
    Crown,
    ExternalLink,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Receipt,
    Zap,
    Shield,
    Users,
    BarChart3,
    FileText,
    HelpCircle,
    RefreshCw,
} from 'lucide-react';
import type { UserBillingInfo } from '@/lib/billing';
import { createClient } from '@/lib/supabase/client';

interface BillingSubscriptionRecord {
    id: string;
    status: string;
    plan_type: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    created_at: string;
    cancel_at_period_end: boolean;
}

interface BillingClientProps {
    billing: UserBillingInfo;
    history: BillingSubscriptionRecord[];
}

const PRO_FEATURES = [
    { icon: Zap, label: 'Unlimited Projects' },
    { icon: Users, label: 'Client Management' },
    { icon: FileText, label: 'Smart Contracts' },
    { icon: BarChart3, label: 'Revenue Reports' },
    { icon: Calendar, label: 'Calendar & Time Tracking' },
    { icon: Shield, label: 'Priority Support' },
];

function formatDate(dateStr: string | null, options?: Intl.DateTimeFormatOptions) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        ...options,
    });
}

function formatShortDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function PlanBadge({ planType }: { planType: string | null }) {
    if (!planType) return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>;
    const isYearly = planType === 'yearly';
    return (
        <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
                background: isYearly ? 'rgba(99,102,241,0.15)' : 'rgba(74,222,128,0.12)',
                color: isYearly ? '#818cf8' : '#4ade80',
            }}
        >
            {isYearly ? '$190/yr' : '$19/mo'}
        </span>
    );
}

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        active:   { label: 'Active',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
        trialing: { label: 'Trial',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
        past_due: { label: 'Past Due',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
        canceled: { label: 'Canceled',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
        expired:  { label: 'Expired',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    };
    const cfg = map[status] ?? map.expired;
    return (
        <span
            className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
        >
            {cfg.label}
        </span>
    );
}

export function BillingClient({ billing, history }: BillingClientProps) {
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);
    const [supportEmail, setSupportEmail] = useState("support@aranora.com");

    useEffect(() => {
        const fetchBranding = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single();
            if (data?.value?.support_email) {
                setSupportEmail(data.value.support_email);
            }
        };
        fetchBranding();
    }, []);

    const handleManageBilling = async () => {
        setPortalLoading(true);
        setPortalError(null);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setPortalError('Could not open billing portal. Please try again or contact support.');
            }
        } catch {
            setPortalError('Network error. Please check your connection and try again.');
        } finally {
            setPortalLoading(false);
        }
    };

    const statusConfig = {
        trialing: {
            label: 'Free Trial',
            color: '#60a5fa',
            bgCss: 'rgba(96,165,250,0.08)',
            borderCss: 'rgba(96,165,250,0.2)',
            icon: Clock,
            description: `${billing.trialDaysRemaining} day${billing.trialDaysRemaining !== 1 ? 's' : ''} remaining`,
        },
        active: {
            label: 'Active',
            color: '#4ade80',
            bgCss: 'rgba(74,222,128,0.08)',
            borderCss: 'rgba(74,222,128,0.2)',
            icon: CheckCircle2,
            description: billing.planType === 'yearly' ? 'Annual Plan' : 'Monthly Plan',
        },
        past_due: {
            label: 'Past Due',
            color: '#fbbf24',
            bgCss: 'rgba(251,191,36,0.08)',
            borderCss: 'rgba(251,191,36,0.2)',
            icon: AlertTriangle,
            description: 'Payment required',
        },
        canceled: {
            label: 'Canceled',
            color: '#94a3b8',
            bgCss: 'rgba(148,163,184,0.08)',
            borderCss: 'rgba(148,163,184,0.2)',
            icon: AlertTriangle,
            description: 'Access until period end',
        },
        expired: {
            label: 'Expired',
            color: '#f87171',
            bgCss: 'rgba(248,113,113,0.08)',
            borderCss: 'rgba(248,113,113,0.2)',
            icon: AlertTriangle,
            description: 'Subscription required',
        },
    };

    const config = statusConfig[billing.status];
    const StatusIcon = config.icon;
    const showUpgradeCTA = billing.status === 'trialing' || billing.status === 'expired';
    const showManagePortal = !!billing.stripeCustomerId;
    const showPlanDetails = billing.status === 'active';
    const showFeatureList = showUpgradeCTA;

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Billing</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        Manage your subscription and billing details
                    </p>
                </div>

                {/* ── Status Card ── */}
                <div
                    className="rounded-2xl border p-6"
                    style={{
                        background: config.bgCss,
                        borderColor: config.borderCss,
                    }}
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div
                                className="p-3 rounded-xl"
                                style={{ background: 'var(--muted)' }}
                            >
                                <StatusIcon className="h-6 w-6" style={{ color: config.color }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {config.label}
                                    </h2>
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{
                                            background: config.bgCss,
                                            color: config.color,
                                            border: `1px solid ${config.borderCss}`,
                                        }}
                                    >
                                        {config.description}
                                    </span>
                                </div>

                                {billing.status === 'trialing' && (
                                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                        Your trial expires on{' '}
                                        <strong style={{ color: 'var(--foreground)' }}>
                                            {formatDate(billing.trialEndsAt)}
                                        </strong>
                                    </p>
                                )}

                                {billing.currentPeriodEnd && billing.status === 'active' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                            Next billing date:{' '}
                                            <strong style={{ color: 'var(--foreground)' }}>
                                                {formatDate(billing.currentPeriodEnd)}
                                            </strong>
                                        </p>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                                            {Math.max(0, Math.ceil((new Date(billing.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                                        </span>
                                    </div>
                                )}

                                {billing.cancelAtPeriodEnd && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">
                                            Subscription will cancel at the end of the current period
                                        </p>
                                    </div>
                                )}

                                {billing.status === 'expired' && (
                                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                        Your subscription has expired. Renew to restore full access.
                                    </p>
                                )}

                                {billing.status === 'past_due' && (
                                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                        A payment is outstanding. Please update your payment method.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Portal Error ── */}
                {portalError && (
                    <div
                        className="rounded-xl border px-4 py-3 flex items-start gap-3 text-sm"
                        style={{
                            background: 'rgba(248,113,113,0.08)',
                            borderColor: 'rgba(248,113,113,0.2)',
                            color: '#f87171',
                        }}
                    >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{portalError}</span>
                    </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {showUpgradeCTA && (
                        <a
                            href="/pricing"
                            className="flex items-center justify-between p-5 rounded-xl transition-all group"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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

                    {showManagePortal && (
                        <button
                            onClick={handleManageBilling}
                            disabled={portalLoading}
                            className="flex items-center justify-between p-5 rounded-xl border transition-colors group text-left disabled:opacity-50"
                            style={{
                                background: 'var(--card)',
                                borderColor: 'var(--border)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--muted-foreground)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                            <div className="flex items-center gap-3">
                                {portalLoading
                                    ? <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                                    : <CreditCard className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
                                }
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {portalLoading ? 'Opening portal…' : 'Manage Billing'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                        Update payment, view invoices
                                    </p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 transition-colors" style={{ color: 'var(--muted-foreground)' }} />
                        </button>
                    )}
                </div>

                {/* ── Active Plan Details ── */}
                {showPlanDetails && (
                    <div
                        className="rounded-xl border p-6"
                        style={{
                            background: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <h3
                            className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"
                            style={{ color: 'var(--muted-foreground)' }}
                        >
                            <Calendar className="h-4 w-4" />
                            Current Plan
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Plan</span>
                                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                    {billing.planType === 'yearly' ? 'Annual ($190/year)' : 'Monthly ($19/month)'}
                                </span>
                            </div>
                            {billing.currentPeriodEnd && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Current period ends</span>
                                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                        {formatShortDate(billing.currentPeriodEnd)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Auto-renewal</span>
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: billing.cancelAtPeriodEnd ? '#fbbf24' : '#4ade80' }}
                                >
                                    {billing.cancelAtPeriodEnd ? 'Off (cancels at period end)' : 'On'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── What's Included (for upgrade states) ── */}
                {showFeatureList && (
                    <div
                        className="rounded-xl border p-6"
                        style={{
                            background: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <h3
                            className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"
                            style={{ color: 'var(--muted-foreground)' }}
                        >
                            <Crown className="h-4 w-4" style={{ color: '#818cf8' }} />
                            What&apos;s Included in Pro
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PRO_FEATURES.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                                    style={{ background: 'var(--muted)' }}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>$19</p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/month</p>
                                </div>
                                <div
                                    className="h-10 w-px"
                                    style={{ background: 'var(--border)' }}
                                />
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>$190</p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/year · save $38</p>
                                </div>
                                <a
                                    href="/pricing"
                                    className="ml-auto inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity"
                                    style={{
                                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                        color: '#fff',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    View Plans <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Billing History ── */}
                {history.length > 0 && (
                    <div
                        className="rounded-xl border overflow-hidden"
                        style={{
                            background: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <div
                            className="px-6 py-4 flex items-center gap-2"
                            style={{ borderBottom: '1px solid var(--border)' }}
                        >
                            <Receipt className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                            <h3
                                className="font-semibold text-sm uppercase tracking-wide"
                                style={{ color: 'var(--muted-foreground)' }}
                            >
                                Billing History
                            </h3>
                        </div>
                        <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
                                    style={{ borderColor: 'var(--border)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ background: 'var(--muted)' }}
                                        >
                                            <Receipt className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                                {record.plan_type === 'yearly'
                                                    ? 'Annual Plan · $190'
                                                    : record.plan_type === 'monthly'
                                                        ? 'Monthly Plan · $19'
                                                        : 'Subscription'
                                                }
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                                {record.current_period_start
                                                    ? `${formatShortDate(record.current_period_start)} → ${formatShortDate(record.current_period_end)}`
                                                    : `Started ${formatShortDate(record.created_at)}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusChip status={record.status} />
                                        <PlanBadge planType={record.plan_type} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {billing.stripeCustomerId && (
                            <div
                                className="px-6 py-3"
                                style={{ borderTop: '1px solid var(--border)' }}
                            >
                                <button
                                    onClick={handleManageBilling}
                                    disabled={portalLoading}
                                    className="text-xs flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                                    style={{ color: 'var(--muted-foreground)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    View full invoices in Stripe portal
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Empty history for expired users ── */}
                {history.length === 0 && billing.status === 'expired' && (
                    <div
                        className="rounded-xl border px-6 py-8 text-center"
                        style={{
                            background: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <Receipt className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No billing history</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                            You haven&apos;t made any payments yet. Subscribe to get started.
                        </p>
                    </div>
                )}

                {/* ── Support Footer ── */}
                <div
                    className="rounded-xl border px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
                    style={{
                        background: 'var(--card)',
                        borderColor: 'var(--border)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <HelpCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                Billing issue or question?
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                We&apos;re here to help with charges, refund requests, and account inquiries.
                            </p>
                        </div>
                    </div>
                    <a
                        href={`mailto:${supportEmail}`}
                        className="text-sm font-semibold whitespace-nowrap"
                        style={{ color: '#818cf8' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                        Contact Support
                    </a>
                </div>

            </div>
        </div>
    );
}
