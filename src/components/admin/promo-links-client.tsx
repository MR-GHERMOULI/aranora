'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Copy, Check, Plus, Clock, XCircle, CheckCircle2, Loader2, Trash2, X, AlertTriangle } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);

    const fetchLinks = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch('/api/admin/promo-links');
            if (!res.ok) throw new Error(`Server error (${res.status})`);
            const data = await res.json();
            setLinks(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load promo links');
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
            setError(null);
            const res = await fetch('/api/admin/promo-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    freeMonths,
                    expiresInDays: expiresInDays || null,
                }),
            });

            if (!res.ok) throw new Error(`Failed to create link (${res.status})`);
            setShowCreate(false);
            setFreeMonths(6);
            setExpiresInDays('');
            await fetchLinks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create promo link');
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            setError(null);
            const res = await fetch(`/api/admin/promo-links?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Failed to deactivate (${res.status})`);
            await fetchLinks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deactivate link');
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
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    <CheckCircle2 className="h-3 w-3" /> Used
                </span>
            );
        }
        if (!link.is_active) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                    <XCircle className="h-3 w-3" /> Deactivated
                </span>
            );
        }
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" /> Expired
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Active
            </span>
        );
    };

    return (
        <div>
            {/* Error Banner */}
            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                        <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:opacity-80">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Gift className="h-6 w-6 text-primary" />
                        Promo Invite Links
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">Generate single-use invitation links with free access</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Generate Link
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                    <h3 className="text-foreground font-semibold mb-4">New Promo Link</h3>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-muted-foreground text-sm mb-2">Free Duration</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFreeMonths(6)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${freeMonths === 6
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    6 Months
                                </button>
                                <button
                                    onClick={() => setFreeMonths(12)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${freeMonths === 12
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    1 Year
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-muted-foreground text-sm mb-2">Expires in (days, optional)</label>
                            <input
                                type="number"
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                                placeholder="e.g. 30"
                                className="w-full py-2.5 px-4 rounded-lg bg-background border border-input text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
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
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : links.length === 0 ? (
                <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
                    <Gift className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No promo links generated yet</p>
                    <p className="text-muted-foreground/80 text-xs mt-1">Click &quot;Generate Link&quot; to create one</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link) => (
                        <div
                            key={link.id}
                            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors hover:border-primary/20"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <code className="text-primary font-mono text-sm">{link.code}</code>
                                    {getStatusBadge(link)}
                                    <span className="text-xs text-secondary-foreground bg-secondary px-2 py-0.5 rounded">
                                        {link.free_months === 12 ? '1 Year Free' : '6 Months Free'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                                    {link.redeemer && (
                                        <span className="text-emerald-600 dark:text-emerald-400">
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
                                            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                                            title="Copy link"
                                        >
                                            {copiedId === link.id ? (
                                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeactivate(link.id)}
                                            className="p-2 rounded-lg bg-secondary hover:bg-destructive/10 text-secondary-foreground hover:text-destructive transition-colors"
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
