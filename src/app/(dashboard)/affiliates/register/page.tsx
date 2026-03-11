'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2, ArrowLeft, Building, Globe, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        companyName: '',
        website: '',
        paymentMethod: 'paypal' as 'paypal' | 'bank_transfer' | 'wise',
        paypalEmail: '',
        bankDetails: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const paymentDetails: Record<string, string> = {};
            if (form.paymentMethod === 'paypal') {
                paymentDetails.paypal_email = form.paypalEmail;
            } else if (form.paymentMethod === 'bank_transfer') {
                paymentDetails.bank_info = form.bankDetails;
            } else if (form.paymentMethod === 'wise') {
                paymentDetails.wise_email = form.paypalEmail;
            }

            const res = await fetch('/api/affiliates/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: form.companyName,
                    website: form.website || null,
                    paymentMethod: form.paymentMethod,
                    paymentDetails,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'Registration failed');
                return;
            }

            router.push('/affiliates');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Link
                href="/affiliates"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Affiliate Dashboard
            </Link>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-teal-400" />
                        </div>
                        <h1 className="text-xl font-bold">Affiliate Program Application</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Join our affiliate program and earn 30% commission on every referral for 12 months.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Company Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            Company / Brand Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={form.companyName}
                            onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                            placeholder="Your company or brand name"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            Website (optional)
                        </label>
                        <input
                            type="url"
                            value={form.website}
                            onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            Preferred Payment Method *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'paypal', label: 'PayPal' },
                                { id: 'wise', label: 'Wise' },
                                { id: 'bank_transfer', label: 'Bank Transfer' },
                            ].map(method => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, paymentMethod: method.id as typeof f.paymentMethod }))}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                        form.paymentMethod === method.id
                                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                                            : 'bg-background border-border text-muted-foreground hover:border-muted-foreground'
                                    }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Details */}
                    {(form.paymentMethod === 'paypal' || form.paymentMethod === 'wise') && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {form.paymentMethod === 'paypal' ? 'PayPal Email' : 'Wise Email'} *
                            </label>
                            <input
                                type="email"
                                required
                                value={form.paypalEmail}
                                onChange={(e) => setForm(f => ({ ...f, paypalEmail: e.target.value }))}
                                placeholder={`Your ${form.paymentMethod === 'paypal' ? 'PayPal' : 'Wise'} email address`}
                                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                            />
                        </div>
                    )}

                    {form.paymentMethod === 'bank_transfer' && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Bank Details *</label>
                            <textarea
                                required
                                value={form.bankDetails}
                                onChange={(e) => setForm(f => ({ ...f, bankDetails: e.target.value }))}
                                placeholder="Bank name, account holder, IBAN / account number, SWIFT code"
                                rows={3}
                                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 resize-none"
                            />
                        </div>
                    )}

                    {/* Terms */}
                    <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground space-y-1.5">
                        <p>By applying, you agree to:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                            <li>Promote Aranora ethically and truthfully</li>
                            <li>Not use spam, misleading ads, or unethical marketing practices</li>
                            <li>Commissions are earned on paid subscriptions from your referrals</li>
                            <li>Commission rate: 30% for 12 months (monthly) or 30% one-time (annual)</li>
                            <li>Minimum payout threshold: $50</li>
                        </ul>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="h-4 w-4" />
                        )}
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
