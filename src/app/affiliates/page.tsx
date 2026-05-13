'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    TrendingUp, Mail, Lock, User, ArrowRight, CheckCircle2,
    DollarSign, Eye, EyeOff, Loader2, Building, ArrowLeft
} from 'lucide-react';

type Mode = 'landing' | 'login' | 'signup';

export default function BecomeAffiliatePage() {
    const [mode, setMode] = useState<Mode>('landing');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({ fullName: '', email: '', password: '' });
    
    const [branding, setBranding] = useState<{site_name: string, logo_url: string | null}>({
        site_name: 'Aranora',
        logo_url: null
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'branding')
                .single();
            
            if (data?.value) {
                setBranding({
                    site_name: data.value.site_name || 'Aranora',
                    logo_url: data.value.logo_url || null
                });
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/affiliate-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'Invalid email or password');
            } else {
                window.location.href = '/affiliates';
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (signupForm.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/affiliate-auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupForm),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'Registration failed');
            } else if (json.requiresLogin) {
                setMode('login');
                setLoginForm({ email: signupForm.email, password: signupForm.password });
                setError('Account created successfully! Please sign in to continue.');
            } else {
                window.location.href = '/affiliates/register';
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const perks = [
        { icon: DollarSign, text: '30% commission on every referral' },
        { icon: TrendingUp, text: '12-month recurring commissions on monthly plans' },
        { icon: CheckCircle2, text: '$57 one-time on every annual plan' },
        { icon: Building, text: 'No platform subscription needed' },
    ];

    return (
        <main className="max-w-6xl mx-auto px-6 pt-32 pb-16 relative">
            {/* Back Button */}
            <div className="mb-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Back to Home
                </Link>
            </div>
                {mode === 'landing' && (
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Info */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium mb-6 border border-teal-500/20">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Affiliate Partner Program
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                                Turn Your Audience Into{' '}
                                <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
                                    Passive Income
                                </span>
                            </h1>
                             <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Refer customers to {branding.site_name} and earn 30% of every subscription for 12 months.
                                No platform subscription required — just sign up and start sharing.
                            </p>

                            {/* Commission highlight */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-card border border-teal-500/20 rounded-xl p-4">
                                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">$5.70<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                    <div className="text-xs text-muted-foreground">Monthly plan referral × 12</div>
                                    <div className="text-xs text-muted-foreground mt-1">= up to $68.40</div>
                                </div>
                                <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">$57</div>
                                    <div className="text-xs text-muted-foreground">Annual plan referral</div>
                                    <div className="text-xs text-muted-foreground mt-1">one-time payout</div>
                                </div>
                            </div>

                            {/* Perks */}
                            <ul className="space-y-3 mb-10">
                                {perks.map((perk, i) => (
                                    <li key={i} className="flex items-center gap-3 text-foreground text-sm">
                                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                                            <perk.icon className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                                        </div>
                                        {perk.text}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => { setMode('signup'); setError(''); }}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25"
                                >
                                    Apply Now <ArrowRight className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setMode('login'); setError(''); }}
                                    className="flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
                                >
                                    Already a partner? Sign in
                                </button>
                            </div>
                        </div>

                        {/* Right: Stats visual */}
                        <div className="hidden lg:block">
                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h3 className="text-foreground font-semibold mb-6 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-teal-500 dark:text-teal-400" />
                                    Affiliate Dashboard Preview
                                </h3>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {[
                                        { label: 'Total Earned', value: '$342.00', color: 'text-emerald-600 dark:text-emerald-400' },
                                        { label: 'This Month', value: '$57.00', color: 'text-teal-600 dark:text-teal-400' },
                                        { label: 'Referrals', value: '12', color: 'text-blue-600 dark:text-blue-400' },
                                        { label: 'Active Subs', value: '8', color: 'text-purple-600 dark:text-purple-400' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-muted/50 rounded-xl p-4 border border-border">
                                            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground mb-3">Recent Commissions</div>
                                    {[
                                        { plan: 'Monthly Plan', month: 'Month 3/12', amount: '+$5.70', status: 'Pending' },
                                        { plan: 'Annual Plan', month: 'One-time', amount: '+$57.00', status: 'Paid' },
                                        { plan: 'Monthly Plan', month: 'Month 1/12', amount: '+$5.70', status: 'Paid' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5 border border-border">
                                            <div>
                                                <div className="text-xs text-foreground">{row.plan}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.month}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${row.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                                                    {row.status}
                                                </span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{row.amount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                {mode === 'login' && (
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-7 w-7 text-teal-500 dark:text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                            <p className="text-muted-foreground text-sm mt-1">Sign in to your affiliate account</p>
                        </div>

                        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-8 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={loginForm.email}
                                        onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="you@example.com"
                                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={loginForm.password}
                                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="••••••••"
                                        className="w-full bg-background border border-input rounded-lg pl-10 pr-10 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="text-right mt-1">
                                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 mt-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                            </button>
                            <p className="text-center text-sm text-muted-foreground">
                                Not a partner yet?{' '}
                                <button type="button" onClick={() => { setMode('signup'); setError(''); }}
                                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
                                    Apply now
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* Signup Form */}
                {mode === 'signup' && (
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-7 w-7 text-teal-500 dark:text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Create Affiliate Account</h2>
                            <p className="text-muted-foreground text-sm mt-1">Free to join — no platform subscription needed</p>
                        </div>

                        <form onSubmit={handleSignup} className="bg-card border border-border rounded-2xl p-8 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        required
                                        value={signupForm.fullName}
                                        onChange={e => setSignupForm(f => ({ ...f, fullName: e.target.value }))}
                                        placeholder="John Doe"
                                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={signupForm.email}
                                        onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="you@example.com"
                                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={signupForm.password}
                                        onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="Min. 8 characters"
                                        className="w-full bg-background border border-input rounded-lg pl-10 pr-10 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground">What happens next?</p>
                                <p>1. Create your account</p>
                                <p>2. Complete affiliate application (company, payment details)</p>
                                <p>3. Get approved → receive your unique referral link</p>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                {loading ? 'Creating account...' : 'Create Account & Continue'}
                            </button>
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
                                    Sign in
                                </button>
                            </p>
                        </form>
                    </div>
                )}
        </main>
    );
}
