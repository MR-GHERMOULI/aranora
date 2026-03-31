"use client"

import { useState } from "react"
import { IntakeForm, IntakeSubmission, IntakeFormField } from "@/types"
import { format, formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Inbox, Eye, CheckCircle, TrendingUp, Copy, Check,
    ExternalLink, Link as LinkIcon, User, Mail, Phone,
    Building2, Calendar, DollarSign, FileText, ChevronRight,
    X, ArrowRight, Archive, MessageSquare, Sparkles
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { updateSubmissionStatus } from "@/app/(dashboard)/intake-forms/actions"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface IntakeFormDetailClientProps {
    form: IntakeForm;
    submissions: IntakeSubmission[];
}

export function IntakeFormDetailClient({ form, submissions: initialSubmissions }: IntakeFormDetailClientProps) {
    const [submissions] = useState(initialSubmissions)
    const [selectedSubmission, setSelectedSubmission] = useState<IntakeSubmission | null>(null)
    const [copiedLink, setCopiedLink] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [internalNotes, setInternalNotes] = useState("")
    const [updating, setUpdating] = useState(false)
    const router = useRouter()

    const copyFormLink = async () => {
        const url = `${window.location.origin}/intake/${form.share_token}`
        await navigator.clipboard.writeText(url)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    const filteredSubmissions = statusFilter === 'all'
        ? submissions
        : submissions.filter(s => s.status === statusFilter)

    const handleStatusUpdate = async (id: string, status: 'reviewed' | 'converted' | 'archived') => {
        setUpdating(true)
        try {
            await updateSubmissionStatus(id, status, internalNotes || undefined)
            router.refresh()
            if (status === 'archived') setSelectedSubmission(null)
        } catch (e) {
            console.error(e)
        } finally {
            setUpdating(false)
        }
    }

    const getFieldLabel = (fieldId: string): string => {
        const field = form.fields.find(f => f.id === fieldId)
        return field?.label || fieldId
    }

    const getFieldType = (fieldId: string): string => {
        const field = form.fields.find(f => f.id === fieldId)
        return field?.type || 'text'
    }

    const renderResponseValue = (fieldId: string, value: any) => {
        const fieldType = getFieldType(fieldId)

        if (value === null || value === undefined || value === '') {
            return <span className="text-slate-400 italic text-sm">Not provided</span>
        }

        if (fieldType === 'multiselect' && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((v: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-xs dark:bg-indigo-950 dark:text-indigo-400">{v}</Badge>
                    ))}
                </div>
            )
        }

        if (fieldType === 'budget_range' && typeof value === 'object') {
            return (
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                        {value.min?.toLocaleString() || '0'} — {value.max?.toLocaleString() || '0'} {value.currency || 'USD'}
                    </span>
                </div>
            )
        }

        if (fieldType === 'date_range' && typeof value === 'object') {
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-700 dark:text-slate-300">{value.start || '?'} → {value.end || '?'}</span>
                </div>
            )
        }

        if (fieldType === 'date') {
            try {
                return <span className="text-slate-700 dark:text-slate-300">{format(new Date(value), 'PPP')}</span>
            } catch {
                return <span className="text-slate-700 dark:text-slate-300">{value}</span>
            }
        }

        if (fieldType === 'select') {
            return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-xs dark:bg-slate-800 dark:text-slate-300">{value}</Badge>
        }

        return <span className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{String(value)}</span>
    }

    const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
        new: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950 dark:text-amber-400", label: "New" },
        reviewed: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950 dark:text-blue-400", label: "Reviewed" },
        converted: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950 dark:text-emerald-400", label: "Converted" },
        archived: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400", label: "Archived" },
    }

    return (
        <>
            {/* Share Link Card */}
            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                <LinkIcon className="h-5 w-5 text-rose-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Share Link</p>
                                <p className="text-sm text-muted-foreground font-mono truncate">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/intake/{form.share_token}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                size="sm"
                                onClick={copyFormLink}
                                className={`h-9 px-4 font-bold gap-2 rounded-lg transition-all ${copiedLink ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'}`}
                            >
                                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copiedLink ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-9 px-3 gap-1.5 font-semibold"
                                onClick={() => window.open(`/intake/${form.share_token}`, '_blank')}
                            >
                                <ExternalLink className="h-3.5 w-3.5" /> Preview
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submissions List */}
            <Card className="border-border shadow-sm overflow-hidden bg-card">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
                    <div className="flex items-center gap-2">
                        <Inbox className="h-4 w-4 text-rose-500/60" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submissions</span>
                        <span className="ml-1 h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                            {submissions.length}
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        {['all', 'new', 'reviewed', 'converted', 'archived'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${statusFilter === status ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                    <div className="py-16 text-center">
                        <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-500 mb-1">No submissions yet</p>
                        <p className="text-xs text-slate-400">Share your form link with clients to start receiving responses</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredSubmissions.map((sub) => {
                            const sc = statusConfig[sub.status] || statusConfig.new
                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => {
                                        setSelectedSubmission(sub)
                                        setInternalNotes(sub.notes || '')
                                    }}
                                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                        {sub.client_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">{sub.client_name}</span>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                                {sc.label}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {sub.client_email && <span className="text-xs text-muted-foreground">{sub.client_email}</span>}
                                            {sub.client_company && <span className="text-xs text-muted-foreground">• {sub.client_company}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 hidden sm:block">
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-rose-500 transition-colors shrink-0" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>

            {/* Submission Detail Dialog */}
            <Dialog open={!!selectedSubmission} onOpenChange={(v) => { if (!v) setSelectedSubmission(null) }}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl gap-0 max-h-[90vh]">
                    {selectedSubmission && (
                        <div className="flex flex-col max-h-[90vh]">
                            {/* Dark Header */}
                            <div className="bg-slate-900 text-white px-6 pt-6 pb-5 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {selectedSubmission.client_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold">{selectedSubmission.client_name}</h3>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                Submitted {formatDistanceToNow(new Date(selectedSubmission.submitted_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusConfig[selectedSubmission.status]?.badge}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[selectedSubmission.status]?.dot}`} />
                                        {statusConfig[selectedSubmission.status]?.label}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-950">
                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedSubmission.client_email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="text-slate-600 dark:text-slate-400 truncate">{selectedSubmission.client_email}</span>
                                        </div>
                                    )}
                                    {selectedSubmission.client_phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="text-slate-600 dark:text-slate-400">{selectedSubmission.client_phone}</span>
                                        </div>
                                    )}
                                    {selectedSubmission.client_company && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="text-slate-600 dark:text-slate-400">{selectedSubmission.client_company}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Responses */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responses</p>
                                    {form.fields.filter(f => f.type !== 'section_header').map((field) => {
                                        const value = selectedSubmission.responses[field.id]
                                        return (
                                            <div key={field.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-slate-500 mb-1.5">{field.label}</p>
                                                {renderResponseValue(field.id, value)}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Internal Notes */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> Internal Notes
                                    </p>
                                    <Textarea
                                        placeholder="Add private notes about this submission..."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        className="min-h-[60px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 shrink-0">
                                <Button
                                    variant="ghost" size="sm"
                                    onClick={() => handleStatusUpdate(selectedSubmission.id, 'archived')}
                                    className="text-slate-400 hover:text-red-500 gap-1.5 font-semibold"
                                    disabled={updating}
                                >
                                    <Archive className="h-4 w-4" /> Archive
                                </Button>
                                <div className="flex items-center gap-2">
                                    {selectedSubmission.status === 'new' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleStatusUpdate(selectedSubmission.id, 'reviewed')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-lg gap-1.5"
                                            disabled={updating}
                                        >
                                            <Eye className="h-4 w-4" /> Mark Reviewed
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        asChild
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg gap-1.5"
                                    >
                                        <Link href={`/contracts?fromIntake=${selectedSubmission.id}`}>
                                            <Sparkles className="h-4 w-4" /> Create Contract
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
