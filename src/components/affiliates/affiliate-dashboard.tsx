'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Users, DollarSign, TrendingUp, Copy, Check, Loader2,
    ExternalLink, ArrowRight, Wallet, Calendar, Share2,
    Twitter, Linkedin, Mail, Clock, AlertCircle, UserPlus
} from 'lucide-react';
import Link from 'next/link';

interface AffiliateStats {
    totalReferrals: number;
    activeSubscriptions: number;
    totalEarned: number;
    pendingEarnings: number;
    paidEarnings: number;
    thisMonthEarnings: number;
    availableBalance: number;
}

interface Commission {
    id: string;
    subscription_type: string;
    invoice_amount: number;
    commission_amount: number;
    commission_month: number;
    status: string;
    created_at: string;
}

interface Referral {
    id: string;
    status: string;
    subscription_type: string | null;
    created_at: string;
    converted_at: string | null;
    referred_user: { full_name: string; company_email: string } | null;
}

interface Payout {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    requested_at: string;
    processed_at: string | null;
    admin_note: string | null;
}

interface AffiliateData {
    id: string;
    affiliate_code: string;
    status: string;
    company_name: string;
    created_at: string;
    approved_at: string | null;
}

type TabType = 'overview' | 'referrals' | 'commissions' | 'payouts';

export function AffiliateDashboard() {
    const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [notRegistered, setNotRegistered] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [copied, setCopied] = useState(false);
    const [payoutLoading, setPayoutLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/affiliates/dashboard');
            if (res.status === 404) {
                setNotRegistered(true);
                return;
            }
            const json = await res.json();
            if (json.affiliate) {
                setAffiliate(json.affiliate);
                setStats(json.stats);
                setCommissions(json.commissions || []);
                setReferrals(json.referrals || []);
                setPayouts(json.payouts || []);
            }
        } catch {
            console.error('Failed to fetch affiliate data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const referralLink = affiliate
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${affiliate.affiliate_code}`
        : '';

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnTwitter = () => {
        const text = encodeURIComponent('Check out Aranora — the all-in-one freelance management platform! 🚀');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent('Try Aranora — Freelance Management Platform');
        const body = encodeURIComponent(`Hey! I've been using Aranora to manage my freelance work. Check it out: ${referralLink}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const requestPayout = async () => {
        setPayoutLoading(true);
        try {
            const res = await fetch('/api/affiliates/payout', { method: 'POST' });
            const json = await res.json();
            if (res.ok) {
                await fetchData();
                setActiveTab('payouts');
            } else {
                alert(json.error || 'Failed to request payout');
            }
        } catch {
            alert('Failed to request payout');
        } finally {
            setPayoutLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            approved: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            canceled: 'text-red-400 bg-red-500/10 border-red-500/20',
            active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            subscribed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            signed_up: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            churned: 'text-red-400 bg-red-500/10 border-red-500/20',
            expired: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
            requested: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
        };
        return colors[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            </div>
        );
    }

    if (notRegistered) {
        return (
            <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                        <UserPlus className="h-8 w-8 text-teal-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Join Our Affiliate Program</h2>
                    <p className="text-slate-400 mb-2 max-w-md mx-auto">
                        Earn <span className="text-teal-400 font-semibold">30% commission</span> on every referral for 12 months.
                        Help spread the word and get rewarded!
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-6">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="text-xl font-bold text-teal-400">$5.70</div>
                            <div className="text-xs text-slate-400 mt-1">per month × 12</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Monthly plans</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                            <div className="text-xl font-bold text-emerald-400">$57.00</div>
                            <div className="text-xs text-slate-400 mt-1">one-time</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Annual plans</div>
                        </div>
                    </div>
                    <Link
                        href="/affiliates/register"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25"
                    >
                        Apply Now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    if (affiliate?.status === 'pending') {
        return (
            <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-800/50 border border-amber-500/20 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                        <Clock className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Application Under Review</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Your affiliate application is being reviewed. You&apos;ll be notified once it&apos;s approved.
                        This usually takes 1-2 business days.
                    </p>
                    <div className="mt-4 text-xs text-slate-500">
                        Applied on {new Date(affiliate.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        );
    }

    if (affiliate?.status === 'rejected') {
        return (
            <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-800/50 border border-red-500/20 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Application Not Approved</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Unfortunately, your affiliate application was not approved at this time.
                        Please contact support for more information.
                    </p>
                </div>
            </div>
        );
    }

    if (affiliate?.status === 'suspended') {
        return (
            <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-800/50 border border-amber-500/20 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Account Suspended</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Your affiliate account has been suspended. Please contact support for more information.
                    </p>
                </div>
            </div>
        );
    }

    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'referrals', label: 'Referrals' },
        { id: 'commissions', label: 'Commissions' },
        { id: 'payouts', label: 'Payouts' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-teal-400" />
                    </div>
                    Affiliate Dashboard
                </h2>
                <p className="text-muted-foreground text-sm mt-1 ml-[52px]">
                    Welcome back, {affiliate?.company_name}
                </p>
            </div>

            {/* Referral Link Card */}
            <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 rounded-xl p-5 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-sm mb-1">Your Referral Link</h3>
                        <p className="text-muted-foreground text-xs">Share this link to earn commissions on every new subscriber</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none bg-background/50 border border-border rounded-lg px-3 py-2 text-xs font-mono truncate max-w-xs">
                            {referralLink}
                        </div>
                        <button
                            onClick={copyLink}
                            className="shrink-0 flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-teal-500/10">
                    <span className="text-xs text-muted-foreground mr-1">Quick share:</span>
                    <button onClick={shareOnTwitter} className="p-1.5 rounded-lg bg-background/30 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors" title="Share on X (Twitter)">
                        <Twitter className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={shareOnLinkedIn} className="p-1.5 rounded-lg bg-background/30 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors" title="Share on LinkedIn">
                        <Linkedin className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={shareViaEmail} className="p-1.5 rounded-lg bg-background/30 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors" title="Share via Email">
                        <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={copyLink} className="p-1.5 rounded-lg bg-background/30 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors" title="Copy Link">
                        <Share2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Users className="h-3.5 w-3.5 text-teal-400" />
                        <span className="text-[11px] font-medium">Referrals</span>
                    </div>
                    <div className="text-xl font-bold">{stats?.totalReferrals || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] font-medium">Active Subs</span>
                    </div>
                    <div className="text-xl font-bold">{stats?.activeSubscriptions || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[11px] font-medium">This Month</span>
                    </div>
                    <div className="text-xl font-bold">${stats?.thisMonthEarnings || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-[11px] font-medium">Total Earned</span>
                    </div>
                    <div className="text-xl font-bold">${stats?.totalEarned || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Wallet className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-[11px] font-medium">Available</span>
                    </div>
                    <div className="text-xl font-bold text-teal-400">${stats?.availableBalance || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[11px] font-medium">Paid Out</span>
                    </div>
                    <div className="text-xl font-bold">${stats?.paidEarnings || 0}</div>
                </div>
            </div>

            {/* Payout Button */}
            {(stats?.availableBalance || 0) >= 50 && (
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={requestPayout}
                        disabled={payoutLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50"
                    >
                        {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                        Request Payout (${stats?.availableBalance || 0})
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-muted/50 p-1 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-6">
                        <h3 className="font-semibold mb-4">Recent Commissions</h3>
                        {commissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p>No commissions yet. Share your referral link to start earning!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {commissions.slice(0, 5).map(comm => (
                                    <div key={comm.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <span className="text-sm font-medium">
                                                {comm.subscription_type === 'yearly' ? 'Annual' : 'Monthly'} Commission
                                                {comm.subscription_type === 'monthly' && (
                                                    <span className="text-muted-foreground ml-1 text-xs">
                                                        (Month {comm.commission_month}/12)
                                                    </span>
                                                )}
                                            </span>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(comm.status)}`}>
                                                {comm.status}
                                            </span>
                                            <span className="font-semibold text-emerald-400">
                                                +${comm.commission_amount}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'referrals' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Plan</th>
                                    <th className="px-4 py-3 font-medium">Signed Up</th>
                                    <th className="px-4 py-3 font-medium">Converted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                            No referrals yet
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map(ref => (
                                        <tr key={ref.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm">
                                                {ref.referred_user?.full_name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(ref.status)}`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {ref.subscription_type === 'yearly' ? 'Annual' : ref.subscription_type === 'monthly' ? 'Monthly' : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(ref.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {ref.converted_at ? new Date(ref.converted_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'commissions' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Plan</th>
                                    <th className="px-4 py-3 font-medium">Month</th>
                                    <th className="px-4 py-3 font-medium text-right">Invoice</th>
                                    <th className="px-4 py-3 font-medium text-right">Commission</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                            No commissions yet
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map(comm => (
                                        <tr key={comm.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {comm.subscription_type === 'yearly' ? 'Annual' : 'Monthly'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {comm.subscription_type === 'monthly' ? `${comm.commission_month}/12` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                                                ${comm.invoice_amount}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-emerald-400">
                                                +${comm.commission_amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(comm.status)}`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">Requested</th>
                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                    <th className="px-4 py-3 font-medium">Method</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Processed</th>
                                    <th className="px-4 py-3 font-medium">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                            No payout requests yet
                                        </td>
                                    </tr>
                                ) : (
                                    payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(p.requested_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">
                                                ${p.amount}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                                                {p.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {p.processed_at ? new Date(p.processed_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
                                                {p.admin_note || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Commission Info */}
            <div className="mt-6 bg-muted/30 border border-border rounded-xl p-5">
                <h4 className="text-sm font-semibold mb-3">How It Works</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-teal-400">1</span>
                        </div>
                        <div>
                            <span className="font-medium">Share your link</span>
                            <p className="text-muted-foreground text-xs mt-0.5">Share your unique referral link with potential customers</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-teal-400">2</span>
                        </div>
                        <div>
                            <span className="font-medium">They subscribe</span>
                            <p className="text-muted-foreground text-xs mt-0.5">When someone subscribes using your link, you earn 30%</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-teal-400">3</span>
                        </div>
                        <div>
                            <span className="font-medium">Get paid</span>
                            <p className="text-muted-foreground text-xs mt-0.5">Request payouts once you reach $50 minimum balance</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
