'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Copy, Check, Plus, Clock, XCircle, CheckCircle2, Loader2, Trash2, ExternalLink } from 'lucide-react';

interface PromoLink {
    id: string;
    code: string;
    free_months: number;
    max_uses: number;
    times_used: number;
    used_by: string | null;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    creator: { full_name: string; company_email: string } | null;
    redeemer: { full_name: string; company_email: string } | null;
}

export function PromoLinksClient() {
    const [links, setLinks] = useState<PromoLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [freeMonths, setFreeMonths] = useState<6 | 12>(6);
    const [expiresInDays, setExpiresInDays] = useState<number | ''>('');

    const fetchLinks = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/promo-links');
            const data = await res.json();
            setLinks(Array.isArray(data) ? data : []);
        } catch {
            console.error('Failed to fetch promo links');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/admin/promo-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    freeMonths,
                    expiresInDays: expiresInDays || null,
                }),
            });

            if (res.ok) {
                setShowCreate(false);
                setFreeMonths(6);
                setExpiresInDays('');
                await fetchLinks();
            }
        } catch {
            console.error('Failed to create promo link');
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await fetch(`/api/admin/promo-links?id=${id}`, { method: 'DELETE' });
            await fetchLinks();
        } catch {
            console.error('Failed to deactivate link');
        }
    };

    const handleCopy = (code: string, id: string) => {
        const url = `${window.location.origin}/promo/${code}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusBadge = (link: PromoLink) => {
        if (link.times_used >= link.max_uses) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    <CheckCircle2 className="h-3 w-3" /> Used
                </span>
            );
        }
        if (!link.is_active) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                    <XCircle className="h-3 w-3" /> Deactivated
                </span>
            );
        }
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    <Clock className="h-3 w-3" /> Expired
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Active
            </span>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Gift className="h-6 w-6 text-indigo-400" />
                        Promo Invite Links
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Generate single-use invitation links with free access</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Generate Link
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">New Promo Link</h3>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Free Duration</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFreeMonths(6)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${freeMonths === 6
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    6 Months
                                </button>
                                <button
                                    onClick={() => setFreeMonths(12)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${freeMonths === 12
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    1 Year
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Expires in (days, optional)</label>
                            <input
                                type="number"
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                                placeholder="e.g. 30"
                                className="w-full py-2.5 px-4 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                            Generate
                        </button>
                    </div>
                </div>
            )}

            {/* Links list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
            ) : links.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <Gift className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No promo links generated yet</p>
                    <p className="text-slate-500 text-xs mt-1">Click &quot;Generate Link&quot; to create one</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link) => (
                        <div
                            key={link.id}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <code className="text-indigo-400 font-mono text-sm">{link.code}</code>
                                    {getStatusBadge(link)}
                                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                                        {link.free_months === 12 ? '1 Year Free' : '6 Months Free'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                                    {link.redeemer && (
                                        <span className="text-emerald-400">
                                            Used by: {link.redeemer.full_name || link.redeemer.company_email}
                                        </span>
                                    )}
                                    {link.expires_at && (
                                        <span>Expires: {new Date(link.expires_at).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {link.is_active && link.times_used < link.max_uses && (
                                    <>
                                        <button
                                            onClick={() => handleCopy(link.code, link.id)}
                                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                                            title="Copy link"
                                        >
                                            {copiedId === link.id ? (
                                                <Check className="h-4 w-4 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeactivate(link.id)}
                                            className="p-2 rounded-lg bg-slate-700 hover:bg-red-600/20 text-slate-300 hover:text-red-400 transition-colors"
                                            title="Deactivate"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
