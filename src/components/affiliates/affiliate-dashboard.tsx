'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, DollarSign, TrendingUp, Copy, Check, Loader2,
    ExternalLink, ArrowRight, Wallet, Calendar, Share2,
    Twitter, Linkedin, Mail, Clock, AlertCircle, UserPlus,
    Award, Medal, Star, ShieldCheck, Download, Image as ImageIcon,
    MessageSquare, MousePointerClick, CreditCard, BarChart3,
    ArrowDownRight, Eye, Percent, Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

interface AffiliateStats {
    totalClicks: number;
    totalReferrals: number;
    totalSignedUp: number;
    totalTrialing: number;
    totalSubscribed: number;
    totalChurned: number;
    totalExpired: number;
    activeSubscriptions: number;
    monthlySubscribers: number;
    yearlySubscribers: number;
    clickToSignupRate: number;
    signupToSubscriptionRate: number;
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
    referred_user: {
        full_name: string;
        company_email: string;
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
    total_clicks: number;
}

interface ClickChartData {
    date: string;
    clicks: number;
}

type TabType = 'overview' | 'statistics' | 'referrals' | 'commissions' | 'payouts' | 'resources';

// Framer Motion Variants
const containerVariant = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function AffiliateDashboard() {
    const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [clickChartData, setClickChartData] = useState<ClickChartData[]>([]);
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
                setClickChartData(json.clickChartData || []);
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

    // Derived Chart Data (Last 6 Months earnings)
    const earningsChartData = useMemo(() => {
        const data: { name: string; earnings: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            data.push({ name: monthName, earnings: 0 });
        }
        commissions.forEach(c => {
            if (c.status === 'canceled') return;
            const date = new Date(c.created_at);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const dataPoint = data.find(d => d.name === monthName);
            if (dataPoint) {
                dataPoint.earnings += Number(c.commission_amount);
            }
        });
        return data;
    }, [commissions]);

    // Tier Logic
    const getTier = (refsCount: number) => {
        if (refsCount >= 50) return { name: 'Gold Partner', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', icon: Award };
        if (refsCount >= 10) return { name: 'Silver Partner', color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20', icon: ShieldCheck };
        return { name: 'Bronze Partner', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: Star };
    };

    const tier = getTier(stats?.totalReferrals || 0);
    const TierIcon = tier.icon;

    const referralLink = affiliate
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?via=${affiliate.affiliate_code}`
        : '';

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnTwitter = () => {
        const text = encodeURIComponent('Stop juggling clients and deadlines — Aranora keeps your freelance business organized in one place. Try it free');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent('Try Aranora — Freelance Management Platform');
        const body = encodeURIComponent(`Hey! I've been using Aranora to manage my freelance business and thought you might like it too. Check it out: ${referralLink}`);
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
            signed_up: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
            trialing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            churned: 'text-red-400 bg-red-500/10 border-red-500/20',
            expired: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
            requested: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
        };
        return colors[status.toLowerCase()] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    const getReferralStatusLabel = (ref: Referral): string => {
        if (ref.status === 'subscribed') {
            return ref.subscription_type === 'yearly' ? 'Annual Subscriber' : 'Monthly Subscriber';
        }
        if (ref.status === 'signed_up') {
            const userProfile = ref.referred_user;
            if (userProfile?.subscription_status === 'trialing' && userProfile?.trial_ends_at) {
                const trialEnd = new Date(userProfile.trial_ends_at);
                if (trialEnd > new Date()) return 'Free Trial';
                return 'Trial Expired';
            }
            return 'Signed Up';
        }
        if (ref.status === 'churned') return 'Churned';
        if (ref.status === 'expired') return 'Expired';
        return ref.status.replace('_', ' ');
    };

    const getTrialDaysRemaining = (ref: Referral): number | null => {
        if (ref.status !== 'signed_up') return null;
        const trialEnd = ref.referred_user?.trial_ends_at;
        if (!trialEnd) return null;
        const diff = new Date(trialEnd).getTime() - Date.now();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
        );
    }

    if (notRegistered) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-10 text-center shadow-2xl shadow-teal-500/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-teal-500/50">
                        <UserPlus className="h-10 w-10 text-teal-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Become a Partner</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                        Earn a massive <span className="text-teal-400 font-semibold">30% recurring commission</span> for every referral.
                        Grow with Aranora.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
                        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50 transition-transform hover:scale-105">
                            <div className="text-2xl font-bold text-teal-400">$5.70</div>
                            <div className="text-sm text-slate-400 mt-1">per month × 12</div>
                            <div className="text-xs text-slate-500 mt-1">Monthly Subs</div>
                        </div>
                        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50 transition-transform hover:scale-105">
                            <div className="text-2xl font-bold text-emerald-400">$57.00</div>
                            <div className="text-sm text-slate-400 mt-1">one-time payout</div>
                            <div className="text-xs text-slate-500 mt-1">Annual Subs</div>
                        </div>
                    </div>
                    <Link
                        href="/affiliates/register"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 w-full sm:w-auto"
                    >
                        Apply to Partner Program <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </motion.div>
        );
    }

    if (affiliate?.status === 'pending') {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/50">
                        <Clock className="h-10 w-10 text-amber-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Under Review</h2>
                    <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                        Your application is currently being evaluated by our team. Approval usually takes 1-2 business days. We will notify you via email.
                    </p>
                    <div className="mt-8 pt-6 border-t border-slate-800 text-sm text-slate-500">
                        Application submitted on {new Date(affiliate.created_at).toLocaleDateString()}
                    </div>
                </div>
            </motion.div>
        );
    }

    if (affiliate?.status === 'rejected' || affiliate?.status === 'suspended') {
        const isSuspended = affiliate.status === 'suspended';
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-12">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-red-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/50">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        {isSuspended ? 'Account Suspended' : 'Application Declined'}
                    </h2>
                    <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                        {isSuspended
                            ? 'Your affiliate account has been temporarily suspended due to a policy violation or review requirement.'
                            : 'Unfortunately, your affiliate application was not approved at this time.'}
                    </p>
                    <button className="mt-8 text-teal-400 hover:text-teal-300 transition-colors font-medium">
                        Contact Support
                    </button>
                </div>
            </motion.div>
        );
    }

    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Dashboard' },
        { id: 'statistics', label: 'Statistics' },
        { id: 'referrals', label: 'Referrals' },
        { id: 'commissions', label: 'Commissions' },
        { id: 'payouts', label: 'Payouts' },
        { id: 'resources', label: 'Resources ✨' },
    ];

    // Funnel data for visual
    const funnelSteps = [
        { label: 'Link Clicks', value: stats?.totalClicks || 0, color: 'from-violet-500 to-purple-500', borderColor: 'border-violet-500/30', icon: MousePointerClick },
        { label: 'Signups', value: stats?.totalReferrals || 0, color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-500/30', icon: UserPlus },
        { label: 'Free Trials', value: stats?.totalTrialing || 0, color: 'from-teal-500 to-emerald-500', borderColor: 'border-teal-500/30', icon: Clock },
        { label: 'Paid', value: stats?.totalSubscribed || 0, color: 'from-emerald-500 to-green-500', borderColor: 'border-emerald-500/30', icon: CreditCard },
    ];

    return (
        <motion.div
            variants={containerVariant}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto pb-12"
        >
            {/* Minimalist Top Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Partner Hub
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${tier.bg} ${tier.color}`}>
                            <TierIcon className="h-3.5 w-3.5" />
                            {tier.name}
                        </span>
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm max-w-xl">
                        Welcome back, <span className="text-white font-medium">{affiliate?.company_name}</span>. Track your performance, manage links, and request payouts.
                    </p>
                </div>
                {(stats?.availableBalance || 0) >= 50 && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={requestPayout}
                        disabled={payoutLoading}
                        className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-100 transition-all shadow-lg shadow-white/10 disabled:opacity-50"
                    >
                        {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                        Request Payout (${stats?.availableBalance || 0})
                    </motion.button>
                )}
            </div>

            {/* Premium Conversion Funnel Strip */}
            <motion.div variants={itemVariant} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {funnelSteps.map((step, i) => {
                    const StepIcon = step.icon;
                    return (
                        <div key={step.label} className={`relative bg-slate-900/60 backdrop-blur-xl border ${step.borderColor} rounded-2xl p-5 overflow-hidden group transition-all hover:scale-[1.02]`}>
                            <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${step.color}`} />
                            <div className="flex items-center gap-2 text-slate-400 mb-2 relative z-10">
                                <StepIcon className="h-4 w-4" />
                                <span className="font-medium text-xs uppercase tracking-wider">{step.label}</span>
                            </div>
                            <div className="text-3xl font-bold text-white relative z-10">{step.value.toLocaleString()}</div>
                            {i > 0 && funnelSteps[i - 1].value > 0 && (
                                <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 relative z-10">
                                    <ArrowDownRight className="h-3 w-3" />
                                    {((step.value / funnelSteps[i - 1].value) * 100).toFixed(1)}% conversion
                                </div>
                            )}
                        </div>
                    );
                })}
            </motion.div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                {/* Main Hero Card - Earnings */}
                <motion.div variants={itemVariant} className="md:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-teal-500/10 rounded-full blur-[100px] -mr-16 -mt-16 transition-opacity opacity-50 group-hover:opacity-100 duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
                        <div>
                            <div className="flex items-center gap-2 text-teal-400/80 mb-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium text-sm">Available Balance</span>
                            </div>
                            <div className="text-6xl font-black text-white tracking-tighter mb-4">
                                ${stats?.availableBalance?.toFixed(2) || '0.00'}
                            </div>
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                                <div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/50">
                                    <span className="text-slate-400 mr-2">Total Earned:</span>
                                    <span className="text-white font-semibold">${stats?.totalEarned?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/50">
                                    <span className="text-slate-400 mr-2">Paid Out:</span>
                                    <span className="text-white font-semibold">${stats?.paidEarnings?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/50">
                                    <span className="text-slate-400 mr-2">This Month:</span>
                                    <span className="text-emerald-400 font-semibold">${stats?.thisMonthEarnings?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart Area in Hero */}
                        <div className="w-full md:w-1/2 h-[140px] mt-4 md:mt-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={earningsChartData}>
                                    <defs>
                                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#14b8a6', fontWeight: 600 }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="earnings" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>

                {/* Secondary Cards */}
                <motion.div variants={itemVariant} className="md:col-span-4 flex flex-col gap-6">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-20 bg-emerald-500/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center gap-2 text-slate-400 mb-2 relative z-10">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-medium text-sm">Active Subscribers</span>
                        </div>
                        <div className="text-4xl font-bold text-white relative z-10">{stats?.activeSubscriptions || 0}</div>
                        <div className="flex items-center gap-3 mt-2 relative z-10">
                            <span className="text-[11px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
                                {stats?.monthlySubscribers || 0} monthly
                            </span>
                            <span className="text-[11px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
                                {stats?.yearlySubscribers || 0} annual
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-20 bg-violet-500/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center gap-2 text-slate-400 mb-2 relative z-10">
                            <Percent className="h-4 w-4" />
                            <span className="font-medium text-sm">Conversion Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-white relative z-10">{stats?.signupToSubscriptionRate || 0}%</div>
                        <div className="text-[11px] text-slate-500 mt-2 relative z-10">
                            Signup → Paid conversion
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Glowing Referral Link Section */}
            <motion.div variants={itemVariant} className="bg-gradient-to-r from-teal-900/40 via-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-6 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-900/20">
                <div className="w-full lg:w-auto">
                    <h3 className="text-lg font-bold text-white mb-1">Your Dedicated Link</h3>
                    <p className="text-slate-400 text-sm">Use this link everywhere to ensure your referrals are tracked.</p>
                </div>
                
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative group flex-1">
                        <div className="absolute inset-0 bg-teal-500/20 rounded-xl blur-md group-hover:bg-teal-500/30 transition-colors" />
                        <div className="relative flex items-center bg-slate-950 border border-teal-500/40 rounded-xl pl-4 pr-1 py-1.5 overflow-hidden font-mono text-sm">
                            <span className="text-slate-300 truncate w-full sm:w-[280px]">{referralLink}</span>
                            <button
                                onClick={copyLink}
                                className="ml-2 shrink-0 flex items-center gap-2 bg-teal-500/20 hover:bg-teal-500/40 text-teal-400 px-4 py-2 rounded-lg font-semibold transition-all"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Social Quick-share */}
                <div className="w-full lg:w-auto flex justify-center lg:justify-end gap-2 border-t lg:border-t-0 lg:border-l border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
                    <button onClick={shareOnTwitter} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Post to X">
                        <Twitter className="h-4 w-4" />
                    </button>
                    <button onClick={shareOnLinkedIn} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Post to LinkedIn">
                        <Linkedin className="h-4 w-4" />
                    </button>
                    <button onClick={shareViaEmail} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Send via Email">
                        <Mail className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>

            {/* Premium Animated Tabs */}
            <div className="mb-6 border-b border-slate-700/50 flex overflow-x-auto no-scrollbar relative">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                            activeTab === tab.id ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-400"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl"
            >
                {activeTab === 'overview' && (
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                        {commissions.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                    <TrendingUp className="h-8 w-8 text-slate-500" />
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">No commissions yet</h4>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                    Start sharing your referral link everywhere. The sooner you share, the faster you earn!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {commissions.slice(0, 10).map(comm => (
                                    <div key={comm.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:bg-slate-800/80 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                                comm.subscription_type === 'yearly' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                            }`}>
                                                <DollarSign className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-white block">
                                                    {comm.subscription_type === 'yearly' ? 'Annual Subscription' : 'Monthly Subscription'}
                                                    {comm.subscription_type === 'monthly' && (
                                                        <span className="text-slate-500 ml-2 font-normal text-xs">
                                                            (Month {comm.commission_month}/12)
                                                        </span>
                                                    )}
                                                </span>
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(comm.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-teal-400 text-lg">
                                                +${comm.commission_amount.toFixed(2)}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusBadge(comm.status)}`}>
                                                {comm.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Compact How-To embedded at bottom of overview */}
                        <div className="mt-12 bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Quick Guide to Success</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm relative">
                                <div className="hidden md:block absolute top-[28px] left-[15%] w-[70%] h-px bg-slate-800" />
                                {[
                                    { step: 1, title: 'Share & Promote', desc: 'Promote Aranora using your unique link on social media.' },
                                    { step: 2, title: 'They Convert', desc: 'When businesses sign up and subscribe, they get tracked.' },
                                    { step: 3, title: 'You Earn', desc: 'Receive 30% recurring for a year, or $57 flat on annual plans.' }
                                ].map((s, i) => (
                                    <div key={i} className="flex flex-col items-center text-center relative z-10">
                                        <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-4 shadow-xl">
                                            <span className="text-lg font-black text-teal-500">{s.step}</span>
                                        </div>
                                        <span className="font-semibold text-white text-base">{s.title}</span>
                                        <p className="text-slate-400 mt-2 text-xs leading-relaxed max-w-[200px]">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== NEW STATISTICS TAB ===== */}
                {activeTab === 'statistics' && (
                    <div className="p-8">
                        {/* Conversion Funnel Visual */}
                        <div className="mb-10">
                            <h3 className="text-xl font-bold text-white mb-2">Conversion Funnel</h3>
                            <p className="text-slate-400 text-sm mb-6">Full transparency into your referral performance at every stage.</p>
                            
                            <div className="space-y-3">
                                {funnelSteps.map((step, i) => {
                                    const StepIcon = step.icon;
                                    const maxValue = Math.max(...funnelSteps.map(s => s.value), 1);
                                    const widthPercent = Math.max((step.value / maxValue) * 100, 8);
                                    const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
                                    const dropOff = prevValue && prevValue > 0
                                        ? ((1 - step.value / prevValue) * 100).toFixed(1)
                                        : null;

                                    return (
                                        <div key={step.label} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <StepIcon className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-white">{step.label}</span>
                                                    {dropOff !== null && Number(dropOff) > 0 && (
                                                        <span className="text-[10px] text-red-400/70 font-medium">
                                                            (-{dropOff}% drop-off)
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-white">{step.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-8 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/30">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${widthPercent}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                                                    className={`h-full bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-end pr-3`}
                                                >
                                                    {step.value > 0 && (
                                                        <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">
                                                            {step.value}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-violet-400 mb-2">
                                    <MousePointerClick className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Click→Signup</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats?.clickToSignupRate || 0}%</div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                    <Zap className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Signup→Paid</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats?.signupToSubscriptionRate || 0}%</div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Churned</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats?.totalChurned || 0}</div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-blue-400 mb-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">In Trial</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats?.totalTrialing || 0}</div>
                            </div>
                        </div>

                        {/* Click Trend Chart */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Link Click Trend</h3>
                            <p className="text-slate-400 text-sm mb-4">Daily clicks over the last 30 days</p>
                            <div className="h-[200px] bg-slate-800/20 rounded-2xl border border-slate-700/30 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={clickChartData}>
                                        <defs>
                                            <linearGradient id="clickBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(v: string) => {
                                                const d = new Date(v);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            stroke="rgba(255,255,255,0.15)"
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            labelFormatter={(v) => new Date(String(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            itemStyle={{ color: '#8b5cf6', fontWeight: 600 }}
                                        />
                                        <Bar dataKey="clicks" fill="url(#clickBarGrad)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'referrals' && (
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                    <th className="px-6 py-5 font-semibold">Referred User</th>
                                    <th className="px-6 py-5 font-semibold">Status</th>
                                    <th className="px-6 py-5 font-semibold">Plan</th>
                                    <th className="px-6 py-5 font-semibold">Billing Period</th>
                                    <th className="px-6 py-5 font-semibold">Trial / Info</th>
                                    <th className="px-6 py-5 font-semibold">Signup Date</th>
                                    <th className="px-6 py-5 font-semibold">Conversion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500 text-sm">
                                            <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                            No referrals tracked yet
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map(ref => {
                                        const trialDays = getTrialDaysRemaining(ref);
                                        const statusLabel = getReferralStatusLabel(ref);
                                        const periodStart = ref.subscription?.current_period_start;
                                        const periodEnd = ref.subscription?.current_period_end;
                                        
                                        return (
                                            <tr key={ref.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-white">
                                                    {ref.referred_user?.full_name || 'Anonymous User'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                                                        ref.status === 'signed_up' && ref.referred_user?.subscription_status === 'trialing' ? 'trialing' : ref.status
                                                    )}`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400 font-medium capitalize">
                                                    {ref.subscription_type
                                                        ? `${ref.subscription_type} Plan`
                                                        : '—'
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">
                                                    {periodStart && periodEnd ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 text-slate-500" />
                                                            {new Date(periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            {' – '}
                                                            {new Date(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ) : '—'}
                                                    {ref.subscription?.cancel_at_period_end && (
                                                        <span className="block text-[10px] text-amber-400 mt-0.5">Cancels at period end</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {trialDays !== null ? (
                                                        trialDays > 0 ? (
                                                            <span className="text-blue-400 font-medium flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {trialDays}d remaining
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-400 text-xs">Trial expired</span>
                                                        )
                                                    ) : ref.status === 'subscribed' ? (
                                                        <span className="text-emerald-400 text-xs font-medium">Active & paying</span>
                                                    ) : ref.status === 'churned' ? (
                                                        <span className="text-red-400 text-xs">Cancelled</span>
                                                    ) : (
                                                        <span className="text-slate-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">
                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                                                    {ref.converted_at ? new Date(ref.converted_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'commissions' && (
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                    <th className="px-6 py-5 font-semibold">Date Acquired</th>
                                    <th className="px-6 py-5 font-semibold">Subscription Plan</th>
                                    <th className="px-6 py-5 font-semibold">Billing Cycle</th>
                                    <th className="px-6 py-5 font-semibold text-right">Invoice Total</th>
                                    <th className="px-6 py-5 font-semibold text-right text-teal-400">Your Share</th>
                                    <th className="px-6 py-5 font-semibold">Payout Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500 text-sm">
                                            <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                            No commission data available
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map(comm => (
                                        <tr key={comm.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-white capitalize">
                                                {comm.subscription_type} Plan
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {comm.subscription_type === 'monthly' ? `Month ${comm.commission_month}/12` : 'One-time Payment'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-400 font-mono">
                                                ${parseFloat(comm.invoice_amount as unknown as string).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded font-bold font-mono">
                                                    +${parseFloat(comm.commission_amount as unknown as string).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(comm.status)}`}>
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
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                                    <th className="px-6 py-5 font-semibold">Date Requested</th>
                                    <th className="px-6 py-5 font-semibold text-right text-teal-400">Withdrawal Amount</th>
                                    <th className="px-6 py-5 font-semibold">Destination</th>
                                    <th className="px-6 py-5 font-semibold">Status</th>
                                    <th className="px-6 py-5 font-semibold">Date Processed</th>
                                    <th className="px-6 py-5 font-semibold">Memo Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500 text-sm">
                                            <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                            You haven&apos;t requested any payouts yet
                                        </td>
                                    </tr>
                                ) : (
                                    payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {new Date(p.requested_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-white font-mono">
                                                ${parseFloat(p.amount as unknown as string).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400 font-medium capitalize">
                                                {p.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {p.processed_at ? new Date(p.processed_at).toLocaleDateString() : 'Pending'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">
                                                {p.admin_note || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="p-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Marketing Toolkit</h3>
                            <p className="text-slate-400 text-sm max-w-2xl">
                                Boost your conversions! We&apos;ve prepared high-converting graphics and copy that you can use immediately on your site or social channels.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Graphic Asset 1 */}
                            <div className="bg-slate-800/40 border border-slate-700/50 flex flex-col rounded-2xl overflow-hidden hover:border-teal-500/30 transition-colors">
                                <div className="h-32 bg-slate-800 flex flex-col items-center justify-center p-4">
                                    <div className="text-2xl font-black text-white tracking-tighter">Aranora</div>
                                    <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Logo Pack</div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Official Brand Logos</h4>
                                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">High resolution light &amp; dark mode vectors (SVG &amp; PNG).</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 font-medium">
                                        <Download className="h-4 w-4" /> Download ZIP
                                    </button>
                                </div>
                            </div>

                            {/* Graphic Asset 2 */}
                            <div className="bg-slate-800/40 border border-slate-700/50 flex flex-col rounded-2xl overflow-hidden hover:border-teal-500/30 transition-colors">
                                <div className="h-32 bg-gradient-to-br from-teal-900 to-slate-900 flex items-center justify-center p-4">
                                    <ImageIcon className="h-10 w-10 text-teal-500/50" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Social Media Banners</h4>
                                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">Pre-sized banners optimized for X, LinkedIn, and Facebook.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 font-medium">
                                        <Download className="h-4 w-4" /> Download pack
                                    </button>
                                </div>
                            </div>

                            {/* Copy Asset */}
                            <div className="bg-slate-800/40 border border-slate-700/50 flex flex-col rounded-2xl overflow-hidden hover:border-teal-500/30 transition-colors">
                                <div className="h-32 bg-slate-800 flex flex-col items-center justify-center p-4">
                                    <MessageSquare className="h-8 w-8 text-blue-400 mb-2" />
                                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">Email Templates</div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Email Campaign Copy</h4>
                                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">High-converting cold and warm email templates to send your list.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 font-medium">
                                        <Copy className="h-4 w-4" /> Copy texts
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-teal-500/5 border border-teal-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center shrink-0">
                                <Award className="h-6 w-6 text-teal-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Do&apos;s and Don&apos;ts</h4>
                                <p className="text-sm text-slate-300 mb-2">We want you to succeed! Always disclose your affiliate relationship (e.g. #ad). Do not run branded PPC campaigns bidding on &quot;Aranora&quot; keywords.</p>
                                <a href="#" className="text-xs text-teal-400 hover:underline">Read full program terms &amp; guidelines →</a>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
