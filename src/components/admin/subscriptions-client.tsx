'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, TrendingUp, Clock, Loader2, Link as LinkIcon, Search } from 'lucide-react';

interface SubscriptionData {
    user_id: string;
    user_name: string;
    user_email: string;
    status: string;
    plan_type: string;
    trial_days_remaining: number;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    promo_code: string | null;
}

interface StatsData {
    totalUsers: number;
    totalActive: number;
    totalTrialing: number;
    mrr: number; // Monthly Recurring Revenue
}

export function SubscriptionsClient() {
    const [data, setData] = useState<SubscriptionData[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/subscriptions');
            const json = await res.json();
            if (json.data && json.stats) {
                setData(json.data);
                setStats(json.stats);
            }
        } catch {
            console.error('Failed to fetch subscriptions data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = data.filter(item =>
        item.user_name.toLowerCase().includes(search.toLowerCase()) ||
        item.user_email?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'trialing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'past_due': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'expired': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'canceled': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
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
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-emerald-400" />
                    Subscriptions & Revenue
                </h2>
                <p className="text-slate-400 text-sm mt-1">Monitor active plans, trials, and monthly recurring revenue</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">MRR (Est.)</span>
                    </div>
                    <div className="text-3xl font-bold text-white">${stats?.mrr || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <CreditCard className="h-4 w-4 text-indigo-400" />
                        <span className="text-sm font-medium">Active Plans</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.totalActive || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">In Trial</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.totalTrialing || 0}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">Total Registered</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/80">
                    <h3 className="font-semibold text-white">Users Dashboard</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">Promo Link</th>
                                <th className="px-4 py-3 font-medium text-right">Trial Left</th>
                                <th className="px-4 py-3 font-medium text-right">Period Ends</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.user_id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white text-sm">{row.user_name}</div>
                                            <div className="text-xs text-slate-500">{row.user_email || 'No email provided'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
                                                {row.status.charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ')}
                                            </span>
                                            {row.cancel_at_period_end && (
                                                <span className="block text-[10px] text-amber-400 mt-1">Canceling soon</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {row.plan_type === 'yearly' ? 'Annual Plan' : row.plan_type === 'monthly' ? 'Monthly Plan' : 'Free Trial'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {row.promo_code ? (
                                                <div className="flex items-center gap-1.5 text-indigo-400">
                                                    <LinkIcon className="h-3 w-3" />
                                                    <span className="font-mono text-xs">{row.promo_code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-slate-300">
                                            {row.trial_days_remaining > 0 ? (
                                                <span className="text-blue-400">{row.trial_days_remaining} d</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-slate-400">
                                            {row.current_period_end
                                                ? new Date(row.current_period_end).toLocaleDateString()
                                                : <span className="text-slate-600">-</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
