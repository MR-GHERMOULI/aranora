'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    UserPlus, Users, DollarSign, Clock, Loader2, Search,
    Check, X, Ban, ExternalLink, Copy, TrendingUp, Wallet
} from 'lucide-react';

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
            case 'active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'suspended': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'rejected': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div>
            {/* Error Banner */}
            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-teal-400" />
                    Affiliate Marketing Program
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Manage affiliate partners, track referrals, and process commissions
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Users className="h-4 w-4 text-teal-400" />
                        <span className="text-xs font-medium">Total Partners</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats?.totalPartners || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-medium">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats?.activePartners || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-medium">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats?.pendingApprovals || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-medium">Referrals</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats?.totalReferrals || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-medium">Paid Out</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${stats?.totalCommissionsPaid || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Wallet className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-medium">Pending Payouts</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${stats?.totalPendingPayouts || 0}</div>
                </div>
            </div>

            {/* Affiliates Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/80">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">Partners</h3>
                        <div className="flex gap-1">
                            {['all', 'active', 'pending', 'suspended'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                        filter === f
                                            ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                                            : 'text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                                    }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
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
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredAffiliates.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        No affiliates found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAffiliates.map((aff) => (
                                    <tr key={aff.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white text-sm">{aff.company_name || aff.user_name}</div>
                                            <div className="text-xs text-slate-500">{aff.user_email}</div>
                                            {aff.website && (
                                                <a href={aff.website} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-0.5">
                                                    <ExternalLink className="h-3 w-3" />
                                                    Website
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <code className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                                                    {aff.affiliate_code}
                                                </code>
                                                <button
                                                    onClick={() => copyCode(aff.affiliate_code)}
                                                    className="text-slate-400 hover:text-white transition-colors"
                                                    title="Copy referral link"
                                                >
                                                    {copiedCode === aff.affiliate_code
                                                        ? <Check className="h-3.5 w-3.5 text-emerald-400" />
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
                                        <td className="px-4 py-3 text-sm text-center text-slate-300">
                                            {aff.totalReferrals}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className="text-emerald-400">{aff.activeReferrals}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-white">
                                            ${aff.total_earned || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="text-amber-400">${aff.pendingCommissions}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="text-emerald-400">${aff.paidCommissions}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">
                                            {new Date(aff.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {actionLoading === aff.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                ) : (
                                                    <>
                                                        {aff.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(aff.id, 'approve')}
                                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(aff.id, 'reject')}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {aff.status === 'active' && (
                                                            <button
                                                                onClick={() => handleAction(aff.id, 'suspend')}
                                                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                                title="Suspend"
                                                            >
                                                                <Ban className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {aff.status === 'suspended' && (
                                                            <button
                                                                onClick={() => handleAction(aff.id, 'activate')}
                                                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                title="Reactivate"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
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
            <div className="mt-6 bg-slate-800/30 border border-slate-700/30 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Commission Structure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0"></div>
                        <div>
                            <span className="text-white font-medium">Monthly Plan ($19/mo)</span>
                            <p className="text-slate-400 text-xs mt-0.5">30% = $5.70/month for 12 months (max $68.40 per referral)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                        <div>
                            <span className="text-white font-medium">Annual Plan ($190/yr)</span>
                            <p className="text-slate-400 text-xs mt-0.5">30% = $57.00 one-time commission</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
