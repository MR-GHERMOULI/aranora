'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    UserPlus, Users, DollarSign, Clock, Loader2, Search,
    Check, X, Ban, ExternalLink, Copy, TrendingUp, Wallet,
    Eye, Calendar, Phone, Mail, Globe, MapPin, CreditCard
} from 'lucide-react';

interface ReferralData {
    id: string;
    referred_user_id: string;
    status: string;
    subscription_type: string | null;
    converted_at: string | null;
    created_at: string;
    referred_user: {
        id: string;
        full_name: string;
        company_email: string;
        phone: string | null;
        country: string | null;
        subscription_status: string | null;
        trial_ends_at: string | null;
    } | null;
    subscription: {
        plan_type: string;
        status: string;
        current_period_start: string | null;
        current_period_end: string | null;
        cancel_at_period_end: boolean;
    } | null;
}

interface AffiliateData {
    id: string;
    user_id: string;
    affiliate_code: string;
    status: string;
    company_name: string;
    website: string | null;
    payment_method: string;
    payment_details: Record<string, string>;
    total_earned: number;
    total_paid: number;
    totalEarned: number;
    created_at: string;
    approved_at: string | null;
    user_name: string;
    user_email: string;
    totalReferrals: number;
    activeReferrals: number;
    pendingCommissions: number;
    paidCommissions: number;
    pendingPayouts: number;
}

interface StatsData {
    totalPartners: number;
    activePartners: number;
    pendingApprovals: number;
    totalCommissionsPaid: number;
    totalPendingPayouts: number;
    totalReferrals: number;
}

export function AffiliatesClient() {
    const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
    const [referralsData, setReferralsData] = useState<ReferralData[]>([]);
    const [referralsLoading, setReferralsLoading] = useState(false);
    const [referralsError, setReferralsError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch('/api/admin/affiliates');
            if (!res.ok) throw new Error(`Server error (${res.status})`);
            const json = await res.json();
            if (json.affiliates && json.stats) {
                setAffiliates(json.affiliates);
                setStats(json.stats);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load affiliates data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (affiliateId: string, action: string) => {
        setActionLoading(affiliateId);
        try {
            setError(null);
            const res = await fetch('/api/admin/affiliates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ affiliateId, action }),
            });
            if (!res.ok) throw new Error(`Action failed (${res.status})`);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to perform action');
        } finally {
            setActionLoading(null);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/ref/${code}`);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const fetchReferrals = async (affiliateId: string) => {
        setSelectedAffiliateId(affiliateId);
        setReferralsLoading(true);
        setReferralsError(null);
        setReferralsData([]);
        
        try {
            const res = await fetch(`/api/admin/affiliates/${affiliateId}/referrals`);
            if (!res.ok) throw new Error(`Failed to fetch referrals (${res.status})`);
            const json = await res.json();
            if (json.referrals) {
                setReferralsData(json.referrals);
            }
        } catch (err) {
            setReferralsError(err instanceof Error ? err.message : 'Error loading referrals');
        } finally {
            setReferralsLoading(false);
        }
    };

    const filteredAffiliates = affiliates
        .filter(aff => {
            if (filter !== 'all' && aff.status !== filter) return false;
            if (search) {
                const s = search.toLowerCase();
                return (
                    aff.company_name?.toLowerCase().includes(s) ||
                    aff.user_name?.toLowerCase().includes(s) ||
                    aff.user_email?.toLowerCase().includes(s) ||
                    aff.affiliate_code?.toLowerCase().includes(s)
                );
            }
            return true;
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'suspended': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
            case 'rejected': return 'text-muted-foreground bg-secondary border-border';
            default: return 'text-muted-foreground bg-secondary border-border';
        }
    };

    const getReferralBadge = (status: string, trialEndsAt: string | null) => {
        if (status === 'subscribed') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (status === 'churned') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (status === 'signed_up' && trialEndsAt && new Date(trialEndsAt) > new Date()) {
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    const getReferralLabel = (status: string, trialEndsAt: string | null) => {
        if (status === 'subscribed') return 'Active Paid';
        if (status === 'churned') return 'Churned';
        if (status === 'signed_up' && trialEndsAt && new Date(trialEndsAt) > new Date()) {
            return 'Trialing';
        }
        if (status === 'signed_up' && trialEndsAt && new Date(trialEndsAt) <= new Date()) {
            return 'Trial Expired';
        }
        return 'Signed Up';
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div>
            {/* Error Banner */}
            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:opacity-80">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    Affiliate Marketing Program
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage affiliate partners, track referrals, and process commissions
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs font-medium">Total Partners</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats?.totalPartners || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats?.activePartners || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats?.pendingApprovals || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium">Referrals</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats?.totalReferrals || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium">Paid Out</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">${stats?.totalCommissionsPaid || 0}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium">Pending Payouts</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">${stats?.totalPendingPayouts || 0}</div>
                </div>
            </div>

            {/* Affiliates Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/80">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">Partners</h3>
                        <div className="flex gap-1">
                            {['all', 'active', 'pending', 'suspended'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                        filter === f
                                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                                            : 'text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground'
                                    }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 font-medium">Partner</th>
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-center">Referrals</th>
                                <th className="px-4 py-3 font-medium text-center">Active</th>
                                <th className="px-4 py-3 font-medium text-right">Earned</th>
                                <th className="px-4 py-3 font-medium text-right">Pending</th>
                                <th className="px-4 py-3 font-medium text-right">Paid</th>
                                <th className="px-4 py-3 font-medium">Joined</th>
                                <th className="px-4 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAffiliates.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">
                                        No affiliates found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAffiliates.map((aff) => (
                                    <tr key={aff.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground text-sm">{aff.company_name || aff.user_name}</div>
                                            <div className="text-xs text-muted-foreground">{aff.user_email}</div>
                                            {aff.website && (
                                                <a href={aff.website} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-0.5">
                                                    <ExternalLink className="h-3 w-3" />
                                                    Website
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <code className="text-xs font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                                                    {aff.affiliate_code}
                                                </code>
                                                <button
                                                    onClick={() => copyCode(aff.affiliate_code)}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Copy referral link"
                                                >
                                                    {copiedCode === aff.affiliate_code
                                                        ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        : <Copy className="h-3.5 w-3.5" />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(aff.status)}`}>
                                                {aff.status.charAt(0).toUpperCase() + aff.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                                            {aff.totalReferrals}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className="text-emerald-600 dark:text-emerald-400">{aff.activeReferrals}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                                            ${aff.totalEarned || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="text-amber-600 dark:text-amber-400">${aff.pendingCommissions}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="text-emerald-600 dark:text-emerald-400">${aff.paidCommissions}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(aff.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {actionLoading === aff.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <>
                                                        {aff.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(aff.id, 'approve')}
                                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(aff.id, 'reject')}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {aff.status === 'active' && (
                                                            <button
                                                                onClick={() => handleAction(aff.id, 'suspend')}
                                                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                                title="Suspend"
                                                            >
                                                                <Ban className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {aff.status === 'suspended' && (
                                                            <button
                                                                onClick={() => handleAction(aff.id, 'activate')}
                                                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                title="Reactivate"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => fetchReferrals(aff.id)}
                                                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors ml-1"
                                                            title="View Referrals"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Commission Rate Info */}
            <div className="mt-6 bg-card/50 border border-border/50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">Commission Structure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 mt-1.5 shrink-0"></div>
                        <div>
                            <span className="text-foreground font-medium">Monthly Plan ($19/mo)</span>
                            <p className="text-muted-foreground text-xs mt-0.5">30% = $5.70/month for 12 months (max $68.40 per referral)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0"></div>
                        <div>
                            <span className="text-foreground font-medium">Annual Plan ($190/yr)</span>
                            <p className="text-muted-foreground text-xs mt-0.5">30% = $57.00 one-time commission</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referrals Viewer Modal */}
            {selectedAffiliateId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-5xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Referred Users</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Detailed list of user accounts generated by{' '}
                                    <span className="font-medium text-foreground">
                                        {affiliates.find(a => a.id === selectedAffiliateId)?.company_name || affiliates.find(a => a.id === selectedAffiliateId)?.user_name}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedAffiliateId(null)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-0 border-b border-border">
                            {referralsLoading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                    Loading referral data...
                                </div>
                            ) : referralsError ? (
                                <div className="flex items-center justify-center h-64 text-red-500">
                                    <Ban className="h-5 w-5 mr-2" />
                                    {referralsError}
                                </div>
                            ) : referralsData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-foreground font-medium">No referrals yet</p>
                                    <p className="text-sm text-muted-foreground">This affiliate hasn't referred any valid user accounts.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
                                            <th className="px-6 py-4 font-semibold">User Details</th>
                                            <th className="px-6 py-4 font-semibold">Contact Info</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Subscription Plan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {referralsData.map(ref => (
                                            <tr key={ref.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground text-sm">
                                                        {ref.referred_user?.full_name || 'Incomplete Profile'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Joined: {new Date(ref.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-xs flex items-center gap-2 text-muted-foreground">
                                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate max-w-[200px] text-foreground">{ref.referred_user?.company_email || '—'}</span>
                                                        </div>
                                                        {ref.referred_user?.phone && (
                                                            <div className="text-xs flex items-center gap-2 text-muted-foreground">
                                                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                                                <span>{ref.referred_user.phone}</span>
                                                            </div>
                                                        )}
                                                        {ref.referred_user?.country && (
                                                            <div className="text-xs flex items-center gap-2 text-muted-foreground">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                                <span>{ref.referred_user.country}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getReferralBadge(ref.status, ref.referred_user?.trial_ends_at || null)}`}>
                                                        {getReferralLabel(ref.status, ref.referred_user?.trial_ends_at || null)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {ref.status === 'subscribed' && ref.subscription_type ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-1.5">
                                                                <CreditCard className="h-3.5 w-3.5" />
                                                                {ref.subscription_type} Plan
                                                            </span>
                                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                                {ref.subscription_type === 'monthly' ? '$19.00 / month' : '$190.00 / year'}
                                                            </span>
                                                        </div>
                                                    ) : ref.status === 'signed_up' && ref.referred_user?.trial_ends_at && new Date(ref.referred_user?.trial_ends_at) > new Date() ? (
                                                        <div className="text-xs text-muted-foreground flex flex-col items-end">
                                                            <span>Free Trial Active</span>
                                                            <span className="text-blue-500">Ends {new Date(ref.referred_user.trial_ends_at).toLocaleDateString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
                            <button
                                onClick={() => setSelectedAffiliateId(null)}
                                className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors border border-border"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
