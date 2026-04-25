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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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

    const [siteName, setSiteName] = useState("Aranora");

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
            
            // Fetch branding for site name
            const supabase = createClient()
            const { data: branding } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single()
            if (branding?.value?.site_name) {
                setSiteName(branding.value.site_name)
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
        if (refsCount >= 10) return { name: 'Silver Partner', color: 'text-foreground/80', bg: 'bg-slate-500/10 border-slate-500/20', icon: ShieldCheck };
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
        const text = encodeURIComponent(`Stop juggling clients and deadlines — ${siteName} keeps your freelance business organized in one place. Try it free`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`Try ${siteName} — Freelance Management Platform`);
        const body = encodeURIComponent(`Hey! I've been using ${siteName} to manage my freelance business and thought you might like it too. Check it out: ${referralLink}`);
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
            signed_up: 'text-primary bg-brand-secondary/10 border-teal-500/20',
            trialing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            churned: 'text-red-400 bg-red-500/10 border-red-500/20',
            expired: 'text-muted-foreground bg-slate-500/10 border-slate-500/20',
            requested: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
        };
        return colors[status.toLowerCase()] || 'text-muted-foreground bg-slate-500/10 border-slate-500/20';
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
                <Loader2 className="h-8 w-8 animate-spin text-brand-secondary" />
            </div>
        );
    }

    if (notRegistered) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-12">
                <div className="bg-card border-border rounded-3xl p-10 text-center shadow-2xl shadow-brand-secondary/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-secondary-dark to-brand-secondary" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-secondary/20 to-green-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-brand-secondary/50">
                        <UserPlus className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Become a Partner</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg leading-relaxed">
                        Earn a massive <span className="text-primary font-semibold">30% recurring commission</span> for every referral.
                        Grow with {siteName}.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
                        <div className="bg-muted rounded-2xl p-5 border border-border transition-transform hover:scale-105">
                            <div className="text-2xl font-bold text-primary">$5.70</div>
                            <div className="text-sm text-muted-foreground mt-1">per month × 12</div>
                            <div className="text-xs text-muted-foreground/80 mt-1">Monthly Subs</div>
                        </div>
                        <div className="bg-muted rounded-2xl p-5 border border-border transition-transform hover:scale-105">
                            <div className="text-2xl font-bold text-emerald-400">$57.00</div>
                            <div className="text-sm text-muted-foreground mt-1">one-time payout</div>
                            <div className="text-xs text-muted-foreground/80 mt-1">Annual Subs</div>
                        </div>
                    </div>
                    <Link
                        href="/affiliates/register"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-secondary-dark to-brand-secondary text-foreground px-8 py-4 rounded-xl font-semibold hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-brand-secondary/30 hover:shadow-brand-secondary/50 w-full sm:w-auto"
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
                <div className="bg-card border border-amber-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/50">
                        <Clock className="h-10 w-10 text-amber-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Under Review</h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                        Your application is currently being evaluated by our team. Approval usually takes 1-2 business days. We will notify you via email.
                    </p>
                    <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground/80">
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
                <div className="bg-card border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-red-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/50">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
                        {isSuspended ? 'Account Suspended' : 'Application Declined'}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                        {isSuspended
                            ? 'Your affiliate account has been temporarily suspended due to a policy violation or review requirement.'
                            : 'Unfortunately, your affiliate application was not approved at this time.'}
                    </p>
                    <Button variant="outline" className="mt-8 font-bold">
                        Contact Partner Support
                    </Button>
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
        { label: 'Free Trials', value: stats?.totalTrialing || 0, color: 'from-teal-500 to-emerald-500', borderColor: 'border-border', icon: Clock },
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
                    <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        Partner Hub
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${tier.bg} ${tier.color}`}>
                            <TierIcon className="h-3.5 w-3.5" />
                            {tier.name}
                        </span>
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm max-w-xl">
                        Welcome back, <span className="text-foreground font-medium">{affiliate?.company_name}</span>. Track your performance, manage links, and request payouts.
                    </p>
                </div>
                {(stats?.availableBalance || 0) >= 50 && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={requestPayout}
                            disabled={payoutLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
                        >
                            {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                            Request Payout (${stats?.availableBalance || 0})
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Premium Conversion Funnel Strip */}
            <motion.div variants={itemVariant} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {funnelSteps.map((step, i) => {
                    const StepIcon = step.icon;
                    return (
                        <Card key={step.label} className="relative overflow-hidden group transition-all hover:shadow-md border-t-0">
                            <div className={cn("absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r", step.color)} />
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <StepIcon className="h-4 w-4" />
                                    <span className="font-medium text-[10px] uppercase tracking-wider">{step.label}</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">{step.value.toLocaleString()}</div>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-0">
                                {i > 0 && funnelSteps[i - 1].value > 0 ? (
                                    <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                        <ArrowDownRight className="h-3 w-3" />
                                        {((step.value / funnelSteps[i - 1].value) * 100).toFixed(1)}% conversion
                                    </div>
                                ) : (
                                    <div className="h-4" />
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </motion.div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                {/* Main Hero Card - Earnings */}
                <motion.div variants={itemVariant} className="md:col-span-8">
                    <Card className="h-full relative overflow-hidden group border-none bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-secondary text-white">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid-aff" width="8" height="8" patternUnits="userSpaceOnUse">
                                        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid-aff)" />
                            </svg>
                        </div>
                        
                        <CardContent className="p-8 h-full">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
                                <div>
                                    <div className="flex items-center gap-2 text-white/70 mb-2">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="font-medium text-sm">Available Balance</span>
                                    </div>
                                    <div className="text-6xl font-black text-white tracking-tighter mb-6">
                                        ${stats?.availableBalance?.toFixed(2) || '0.00'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm flex-wrap">
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                                            <span className="text-white/70 mr-2">Total Earned:</span>
                                            <span className="text-white font-semibold">${stats?.totalEarned?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                                            <span className="text-white/70 mr-2">Paid Out:</span>
                                            <span className="text-white font-semibold">${stats?.paidEarnings?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                                            <span className="text-white/70 mr-2">This Month:</span>
                                            <span className="text-white font-semibold">${stats?.thisMonthEarnings?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Area in Hero */}
                                <div className="w-full md:w-5/12 h-[160px] mt-4 md:mt-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={earningsChartData}>
                                            <defs>
                                                <linearGradient id="colorEarningsAff" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="white" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="white" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(30, 58, 95, 0.9)', 
                                                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                                                    borderRadius: '12px', 
                                                    color: '#fff',
                                                    backdropFilter: 'blur(8px)'
                                                }}
                                                itemStyle={{ color: '#fff', fontWeight: 600 }}
                                                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="earnings" 
                                                stroke="white" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorEarningsAff)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Secondary Cards */}
                <motion.div variants={itemVariant} className="md:col-span-4 flex flex-col gap-6">
                    <Card className="relative overflow-hidden group hover:shadow-md border-l-4 border-l-brand-secondary">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <CreditCard className="h-4 w-4" />
                                <span className="font-medium text-xs uppercase">Active Subscribers</span>
                            </div>
                            <CardTitle className="text-4xl font-bold text-foreground">{stats?.activeSubscriptions || 0}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-normal text-[10px] py-0">
                                    {stats?.monthlySubscribers || 0} monthly
                                </Badge>
                                <Badge variant="secondary" className="font-normal text-[10px] py-0">
                                    {stats?.yearlySubscribers || 0} annual
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="relative overflow-hidden group hover:shadow-md border-l-4 border-l-blue-500">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Percent className="h-4 w-4" />
                                <span className="font-medium text-xs uppercase">Conversion Rate</span>
                            </div>
                            <CardTitle className="text-4xl font-bold text-foreground">{stats?.signupToSubscriptionRate || 0}%</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <p className="text-[11px] text-muted-foreground">Signup → Paid conversion</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Branded Referral Link Section */}
            <motion.div variants={itemVariant}>
                <Card className="p-6 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative border-brand-primary/20 bg-muted/30">
                   <div className="absolute inset-0 bg-brand-primary/5 opacity-50 pointer-events-none" />
                   <div className="relative z-10 w-full lg:w-auto">
                        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-brand-primary" />
                            Your Dedicated Link
                        </h3>
                        <p className="text-muted-foreground text-sm">Use this link everywhere to ensure your referrals are tracked.</p>
                    </div>
                    
                    <div className="relative z-10 w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative group flex-1">
                            <div className="absolute inset-0 bg-brand-secondary/10 rounded-xl blur-md group-hover:bg-brand-secondary/20 transition-colors" />
                            <div className="relative flex items-center bg-background border border-border rounded-xl pl-4 pr-1 py-1.5 overflow-hidden font-mono text-sm shadow-inner">
                                <span className="text-foreground/80 truncate w-full sm:w-[280px]">{referralLink}</span>
                                <Button
                                    onClick={copyLink}
                                    variant="secondary"
                                    size="sm"
                                    className="ml-2 h-9 px-4 font-semibold shrink-0"
                                >
                                    {copied ? <Check className="h-4 w-4 mr-2 text-brand-secondary-dark" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Social Quick-share */}
                    <div className="relative z-10 w-full lg:w-auto flex justify-center lg:justify-end gap-2 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                        <Button variant="ghost" size="icon" onClick={shareOnTwitter} className="rounded-full hover:bg-white dark:hover:bg-slate-800" title="Post to X">
                            <Twitter className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={shareOnLinkedIn} className="rounded-full hover:bg-white dark:hover:bg-slate-800" title="Post to LinkedIn">
                            <Linkedin className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={shareViaEmail} className="rounded-full hover:bg-white dark:hover:bg-slate-800" title="Send via Email">
                            <Mail className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* Premium Animated Tabs */}
            <div className="mb-6 border-b border-border flex overflow-x-auto no-scrollbar relative">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                            activeTab === tab.id ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-primary"
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
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
            >
                {activeTab === 'overview' && (
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Commissions Column */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-foreground">Recent Commissions</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('commissions')} className="text-xs h-8">View All</Button>
                                </div>
                                {commissions.length === 0 ? (
                                    <div className="text-center py-12 px-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-base font-semibold text-foreground mb-1">No commissions yet</h4>
                                        <p className="text-muted-foreground text-xs max-w-[200px] mx-auto">
                                            Earnings will appear here once your referrals subscribe.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {commissions.slice(0, 5).map(comm => (
                                            <div key={comm.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-brand-primary/20 hover:bg-muted/50 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                                        comm.subscription_type === 'yearly' ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-blue-100 dark:bg-blue-500/10 border-blue-500/20 text-blue-600'
                                                    }`}>
                                                        <DollarSign className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-foreground block">
                                                            {comm.subscription_type === 'yearly' ? 'Annual Subscription' : 'Monthly Subscription'}
                                                            {comm.subscription_type === 'monthly' && (
                                                                <span className="text-muted-foreground/80 ml-1 font-normal text-xs">
                                                                    (Month {comm.commission_month}/12)
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 uppercase tracking-wider font-medium">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(comm.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="font-bold text-foreground text-base">
                                                        +${comm.commission_amount.toFixed(2)}
                                                    </span>
                                                    <Badge variant="outline" className={cn("text-[9px] font-bold px-1.5 py-0 h-4 border-none", getStatusBadge(comm.status))}>
                                                        {comm.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Signups Column */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-foreground">Recent Signups</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('referrals')} className="text-xs h-8">View All</Button>
                                </div>
                                {referrals.length === 0 ? (
                                    <div className="text-center py-12 px-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                                            <UserPlus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-base font-semibold text-foreground mb-1">No signups yet</h4>
                                        <p className="text-muted-foreground text-xs max-w-[200px] mx-auto">
                                            Start sharing your link to get your first referral.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {referrals.slice(0, 5).map(ref => {
                                            const statusLabel = getReferralStatusLabel(ref);
                                            const computedStatus = ref.status === 'signed_up' && ref.referred_user?.subscription_status === 'trialing' ? 'trialing' : ref.status;
                                            
                                            return (
                                                <div key={ref.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-brand-primary/20 hover:bg-muted/50 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-background transition-colors">
                                                            <Users className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-foreground block">
                                                                {ref.referred_user?.full_name || 'Anonymous User'}
                                                            </span>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 uppercase tracking-wider font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(ref.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={cn("text-[9px] font-bold px-1.5 py-0 h-4 border-none", getStatusBadge(computedStatus))}>
                                                        {statusLabel}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Compact How-To embedded at bottom of overview */}
                        <div className="mt-12 bg-background/50 rounded-2xl p-6 border border-border">
                            <h4 className="text-sm font-bold text-foreground/80 uppercase tracking-widest mb-6">Quick Guide to Success</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm relative">
                                <div className="hidden md:block absolute top-[28px] left-[15%] w-[70%] h-px bg-muted" />
                                {[
                                    { step: 1, title: 'Share & Promote', desc: 'Promote Aranora using your unique link on social media.' },
                                    { step: 2, title: 'They Convert', desc: 'When businesses sign up and subscribe, they get tracked.' },
                                    { step: 3, title: 'You Earn', desc: 'Receive 30% recurring for a year, or $57 flat on annual plans.' }
                                ].map((s, i) => (
                                    <div key={i} className="flex flex-col items-center text-center relative z-10">
                                        <div className="w-14 h-14 rounded-full bg-card border-2 border-border flex items-center justify-center mb-4 shadow-xl">
                                            <span className="text-lg font-black text-brand-secondary">{s.step}</span>
                                        </div>
                                        <span className="font-semibold text-foreground text-base">{s.title}</span>
                                        <p className="text-muted-foreground mt-2 text-xs leading-relaxed max-w-[200px]">{s.desc}</p>
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
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-foreground mb-1">Conversion Funnel</h3>
                            <p className="text-muted-foreground text-sm mb-8">Performance metrics at every stage of the referral lifecycle.</p>
                            
                            <div className="space-y-4 max-w-4xl">
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
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("p-1.5 rounded-lg bg-muted border border-border group-hover:bg-background transition-colors")}>
                                                        <StepIcon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground">{step.label}</span>
                                                    {dropOff !== null && Number(dropOff) > 0 && (
                                                        <Badge variant="secondary" className="text-[10px] font-medium bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-none">
                                                            -{dropOff}% loss
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-10 bg-muted/30 rounded-xl overflow-hidden border border-border/50 relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${widthPercent}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1, ease: 'circOut' }}
                                                    className={cn("h-full bg-gradient-to-r rounded-r-none rounded-l-lg shadow-sm relative", step.color)}
                                                >
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </motion.div>
                                                {step.value === 0 && (
                                                    <div className="absolute inset-0 flex items-center pl-4 text-[10px] text-muted-foreground/50 font-medium">No data yet</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Efficiency Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[
                                { label: 'Click→Signup', value: `${stats?.clickToSignupRate || 0}%`, icon: MousePointerClick, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                                { label: 'Signup→Paid', value: `${stats?.signupToSubscriptionRate || 0}%`, icon: Zap, color: 'text-brand-secondary-dark', bg: 'bg-brand-secondary/10' },
                                { label: 'Churned', value: stats?.totalChurned || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                                { label: 'In Trial', value: stats?.totalTrialing || 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            ].map((stat, i) => (
                                <Card key={i} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                                        </div>
                                        <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Click Trend Chart */}
                        <Card className="p-8 border-none bg-muted/20">
                            <CardHeader className="px-0 pt-0 pb-6">
                                <CardTitle className="text-xl font-bold">Link Usage Activity</CardTitle>
                                <CardDescription>Daily clicks over the last 30 days</CardDescription>
                            </CardHeader>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={clickChartData}>
                                        <defs>
                                            <linearGradient id="clickBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(v: string) => {
                                                const d = new Date(v);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{ fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis 
                                            stroke="hsl(var(--muted-foreground))" 
                                            tick={{ fontSize: 10 }} 
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false} 
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '12px',
                                                color: 'hsl(var(--foreground))',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelFormatter={(v) => new Date(String(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            itemStyle={{ color: '#8b5cf6', fontWeight: 600 }}
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="clicks" fill="url(#clickBarGrad)" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'referrals' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest border-b border-border bg-muted/20">
                                    <th className="px-8 py-5 font-bold">User</th>
                                    <th className="px-6 py-5 font-bold">Status</th>
                                    <th className="px-6 py-5 font-bold">Plan</th>
                                    <th className="px-6 py-5 font-bold">Period</th>
                                    <th className="px-6 py-5 font-bold">Lifecycle</th>
                                    <th className="px-6 py-5 font-bold">Joined</th>
                                    <th className="px-8 py-5 font-bold">Converted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground/80 text-sm">
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
                                            <tr key={ref.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 group">
                                                <td className="px-8 py-4 text-sm font-semibold text-foreground">
                                                    {ref.referred_user?.full_name || 'Anonymous User'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0 border-none", getStatusBadge(
                                                        ref.status === 'signed_up' && ref.referred_user?.subscription_status === 'trialing' ? 'trialing' : ref.status
                                                    ))}>
                                                        {statusLabel}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground font-medium capitalize">
                                                    {ref.subscription_type
                                                        ? `${ref.subscription_type}`
                                                        : '—'
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {periodStart && periodEnd ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 text-muted-foreground/80" />
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
                                                        <span className="text-muted-foreground/80">—</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-xs text-brand-secondary font-bold">
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest border-b border-border bg-muted/20">
                                    <th className="px-8 py-5 font-bold">Date</th>
                                    <th className="px-6 py-5 font-bold">Plan</th>
                                    <th className="px-6 py-5 font-bold">Lifecycle</th>
                                    <th className="px-6 py-5 font-bold text-right">Invoice</th>
                                    <th className="px-6 py-5 font-bold text-right text-brand-primary">Commission</th>
                                    <th className="px-8 py-5 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/80 text-sm">
                                            <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                            No commission data available
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map(comm => (
                                        <tr key={comm.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                            <td className="px-8 py-4 text-xs text-foreground/70">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-foreground capitalize">
                                                {comm.subscription_type} Plan
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {comm.subscription_type === 'monthly' ? `Month ${comm.commission_month}/12` : 'Full Year'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-muted-foreground font-mono">
                                                ${parseFloat(comm.invoice_amount as unknown as string).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-brand-secondary/10 dark:bg-brand-secondary/20 text-brand-secondary-dark dark:text-brand-secondary px-2 py-0.5 rounded-lg font-bold font-mono text-sm border border-brand-secondary/20">
                                                    +${parseFloat(comm.commission_amount as unknown as string).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0 border-none", getStatusBadge(comm.status))}>
                                                    {comm.status}
                                                </Badge>
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
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest border-b border-border bg-muted/20">
                                    <th className="px-8 py-5 font-bold">Request Date</th>
                                    <th className="px-6 py-5 font-bold text-right text-brand-primary">Amount</th>
                                    <th className="px-6 py-5 font-bold">Method</th>
                                    <th className="px-6 py-5 font-bold">Status</th>
                                    <th className="px-6 py-5 font-bold">Processed</th>
                                    <th className="px-8 py-5 font-bold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/80 text-sm">
                                            <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                            You haven&apos;t requested any payouts yet
                                        </td>
                                    </tr>
                                ) : (
                                    payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                            <td className="px-8 py-4 text-xs text-foreground/70">
                                                {new Date(p.requested_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-foreground font-mono">
                                                ${parseFloat(p.amount as unknown as string).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium capitalize">
                                                {p.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0 border-none", getStatusBadge(p.status))}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {p.processed_at ? new Date(p.processed_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-8 py-4 text-xs text-muted-foreground/80 max-w-[200px] truncate">
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
                        <div className="mb-10">
                            <h3 className="text-2xl font-bold text-foreground mb-2">Partner Toolkit</h3>
                            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                                Accelerate your growth with pre-made marketing materials. Use these professional brand assets and high-converting copy to start sharing immediately.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Graphic Asset 1 */}
                            <Card className="flex flex-col rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all border-none bg-muted/30">
                                <div className="h-40 bg-zinc-100 dark:bg-zinc-900 border-b border-border flex flex-col items-center justify-center p-4 relative">
                                    <div className="text-3xl font-black text-brand-primary tracking-tighter drop-shadow-sm">Aranora</div>
                                    <div className="text-[10px] text-brand-secondary font-bold uppercase tracking-[0.2em] mt-2">Identity Pack</div>
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-brand-primary text-[9px] uppercase">SVG/PNG</Badge>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground mb-1.5 flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            Official Logos
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Verified brand marks in all color formats for professional integration.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2 font-bold group-hover:bg-brand-primary group-hover:text-white transition-all">
                                        <Download className="h-3.5 w-3.5" /> Download Identity
                                    </Button>
                                </div>
                            </Card>

                            {/* Graphic Asset 2 */}
                            <Card className="flex flex-col rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all border-none bg-muted/30">
                                <div className="h-40 bg-gradient-to-br from-brand-primary to-brand-primary-light border-b border-border flex items-center justify-center p-4 relative overflow-hidden">
                                     <div className="absolute inset-0 opacity-20 pointer-events-none">
                                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <path d="M0 100 Q 50 0 100 100" fill="white" />
                                        </svg>
                                    </div>
                                    <ImageIcon className="h-12 w-12 text-white/50 relative z-10" />
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-white text-brand-primary text-[9px] uppercase">Banners</Badge>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground mb-1.5 flex items-center gap-2">
                                            <Share2 className="h-4 w-4 text-muted-foreground" />
                                            Social Graphics
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Optimized banners for LinkedIn, X (Twitter), and Instagram ads.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2 font-bold group-hover:bg-brand-primary group-hover:text-white transition-all">
                                        <Download className="h-3.5 w-3.5" /> Download Pack
                                    </Button>
                                </div>
                            </Card>

                            {/* Copy Asset */}
                            <Card className="flex flex-col rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all border-none bg-muted/30">
                                <div className="h-40 bg-zinc-100 dark:bg-zinc-900 border-b border-border flex flex-col items-center justify-center p-4 relative">
                                    <MessageSquare className="h-10 w-10 text-blue-500 mb-3 opacity-50" />
                                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Email Templates</div>
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-blue-500 text-white text-[9px] uppercase">Text</Badge>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground mb-1.5 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            Campaign Scripts
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Ready-to-use email series designed to drive interest and conversions.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2 font-bold group-hover:bg-brand-primary group-hover:text-white transition-all">
                                        <Copy className="h-3.5 w-3.5" /> View Templates
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        <Card className="mt-12 border-none bg-brand-primary/[0.03] dark:bg-brand-primary/10 overflow-hidden relative">
                            <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" />
                            <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20">
                                    <Award className="h-7 w-7 text-brand-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                        Partner Guidelines & Ethics
                                        <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest bg-brand-primary/10 text-brand-primary">Required</Badge>
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-3xl">
                                        We value transparency and integrity. Please ensure you always disclose your affiliate status (like using <span className="text-brand-primary font-mono font-bold">#ad</span> or <span className="text-brand-primary font-mono font-bold">#partner</span>). 
                                        Note that bidding on branded keywords (&quot;Aranora&quot;) in PPC campaigns is strictly prohibited and may lead to account suspension.
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-brand-primary font-bold">
                                        Review full program terms &amp; conditions →
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
