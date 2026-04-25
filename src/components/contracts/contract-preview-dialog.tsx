"use client"

import { useState, useEffect } from "react"
import { Contract } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DownloadContractButton } from "@/components/contracts/download-contract-button"
import {
    Eye, X, Printer, CheckCircle, Send, Clock, Shield,
    FileSignature, User, Calendar, DollarSign, Briefcase
} from "lucide-react"
import { format } from "date-fns"

interface ContractPreviewDialogProps {
    contract: Contract & { client?: any }
    profile?: any
    triggerClassName?: string
}

export function ContractPreviewDialog({ contract, profile, triggerClassName }: ContractPreviewDialogProps) {
    const [open, setOpen] = useState(false)
    const [platformName, setPlatformName] = useState("Aranora")

    useEffect(() => {
        const fetchBranding = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single();
            if (data?.value?.site_name) {
                setPlatformName(data.value.site_name);
            }
        };
        fetchBranding();
    }, []);

    const statusConfig = {
        Signed: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle, label: "Signed" },
        Sent: { color: "text-blue-700 bg-blue-50 border-blue-200", icon: Send, label: "Awaiting Signature" },
        Draft: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock, label: "Draft" },
    }[contract.status as 'Signed' | 'Sent' | 'Draft'] ?? {
        color: "text-slate-700 bg-slate-50 border-slate-200", icon: Clock, label: contract.status
    }

    const StatusIcon = statusConfig.icon
    const cd = contract.contract_data

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const providerName = profile?.company_name || profile?.full_name || 'Service Provider'
        const clientName = contract.client?.name || 'Client'

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${contract.title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; padding: 60px 80px; line-height: 1.8; }
                    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .title { font-size: 28px; font-weight: bold; color: #1e3a5f; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .status { padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                    .status-signed { background: #d1fae5; color: #047857; }
                    .status-sent { background: #dbeafe; color: #1d4ed8; }
                    .status-draft { background: #f3f4f6; color: #4b5563; }
                    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
                    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: bold; margin-bottom: 6px; }
                    .party-name { font-size: 16px; font-weight: bold; color: #0f172a; }
                    .terms { margin: 30px 0; }
                    .terms-label { font-size: 14px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
                    .content { white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #334155; }
                    .content h1, .content h2, .content h3 { color: #1e3a5f; margin: 16px 0 8px; }
                    .content ul, .content ol { padding-left: 24px; }
                    .signature-section { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 30px; display: flex; justify-content: space-between; }
                    .sig-box { width: 45%; }
                    .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: bold; }
                    .sig-line { border-top: 2px solid #0f172a; margin-top: 60px; padding-top: 10px; }
                    .sig-name { font-size: 14px; font-weight: bold; color: #0f172a; }
                    .sig-img { max-width: 180px; max-height: 70px; margin-top: 10px; }
                    .footer { position: fixed; bottom: 30px; left: 80px; right: 80px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    @media print { body { padding: 40px 50px; } .footer { position: fixed; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">${contract.title}</div>
                        <div class="subtitle">${providerName} • Contract Agreement</div>
                    </div>
                    <span class="status status-${contract.status.toLowerCase()}">${contract.status === 'Signed' ? '✓ SIGNED' : contract.status.toUpperCase()}</span>
                </div>

                <div class="parties">
                    <div>
                        <div class="party-label">Service Provider</div>
                        <div class="party-name">${providerName}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="party-label">Client</div>
                        <div class="party-name">${clientName}</div>
                    </div>
                </div>

                <div class="terms">
                    <div class="terms-label">Agreement Terms</div>
                    <div class="content">${contract.content || 'No terms specified.'}</div>
                </div>

                <div class="signature-section">
                    <div class="sig-box">
                        <div class="sig-label">Service Provider</div>
                        <div class="sig-line">
                            <div class="sig-name">${providerName}</div>
                        </div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-label">Client</div>
                        ${contract.status === 'Signed' && contract.signature_data
                ? `<div><img src="${contract.signature_data}" class="sig-img" /><div class="sig-line"><div class="sig-name">${contract.signer_name || clientName}</div></div></div>`
                : `<div class="sig-line"><div class="sig-name">${clientName}</div></div>`
            }
                    </div>
                </div>

                <div class="footer">
                    This document was generated by ${providerName || platformName}. Electronic signatures are legally binding.
                </div>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 500)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={triggerClassName || "h-8 px-3 text-xs font-semibold gap-1.5 hover:bg-brand-primary/10 hover:text-brand-primary"}
                >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden border-none shadow-2xl gap-0 flex flex-col">

                {/* ── Header Bar ── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                            <FileSignature className="h-4 w-4 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-[300px]">{contract.title}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 border ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 px-3.5 gap-1.5 font-semibold text-xs border-slate-200"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                        </Button>
                        <DownloadContractButton contract={contract} profile={profile} />
                    </div>
                </div>

                {/* ── Document Preview ── */}
                <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 md:p-10">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/5 dark:ring-slate-700/30 rounded-lg overflow-hidden">

                        {/* Top accent bar */}
                        <div className="h-1.5 bg-gradient-to-r from-brand-primary via-indigo-500 to-blue-500" />

                        <div className="p-8 md:p-14 lg:p-16">

                            {/* Title */}
                            <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-6 mb-10 flex justify-between items-end gap-6">
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-serif text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                                        {contract.title}
                                    </h1>
                                    <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-widest">
                                        {profile?.company_name || profile?.full_name || platformName} • Contract Agreement
                                    </p>
                                </div>
                                {contract.status === 'Signed' && (
                                    <div className="flex flex-col items-center space-y-1 opacity-80 rotate-[-5deg] shrink-0 mb-2">
                                        <div className="px-3 py-1 border-[3px] border-emerald-600 rounded-lg text-emerald-600 font-bold uppercase tracking-widest text-xs">
                                            Fully Executed
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Parties */}
                            <div className="flex flex-col md:flex-row gap-6 mb-10 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <User className="h-3 w-3" /> Service Provider
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {profile?.company_name || profile?.full_name || platformName}
                                    </p>
                                </div>
                                {contract.client && (
                                    <div className="flex-1 md:text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 md:justify-end">
                                            <Briefcase className="h-3 w-3" /> Client
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{contract.client.name}</p>
                                        {contract.client.email && (
                                            <p className="text-xs text-slate-500 mt-0.5">{contract.client.email}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Key Terms Summary */}
                            {cd && (
                                <div className="mb-10 p-5 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/20 border-l-4 border-l-brand-primary">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Key Terms</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        {cd.total_amount !== undefined && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><DollarSign className="h-3 w-3" /> Amount</p>
                                                <p className="font-bold text-slate-900 dark:text-slate-100">{cd.total_amount} {cd.currency || 'USD'}</p>
                                            </div>
                                        )}
                                        {cd.payment_type && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Type</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{cd.payment_type}</p>
                                            </div>
                                        )}
                                        {cd.payment_schedule && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Schedule</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{cd.payment_schedule}</p>
                                            </div>
                                        )}
                                        {cd.start_date && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{format(new Date(cd.start_date), 'MMM d, yyyy')}</p>
                                            </div>
                                        )}
                                        {cd.end_date && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">End Date</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{cd.end_date ? format(new Date(cd.end_date), 'MMM d, yyyy') : 'Open Ended'}</p>
                                            </div>
                                        )}
                                        {cd.ip_ownership && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">IP Ownership</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{cd.ip_ownership}</p>
                                            </div>
                                        )}
                                    </div>

                                    {cd.deliverables && cd.deliverables.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-500/20">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Deliverables</p>
                                            <ul className="space-y-1">
                                                {cd.deliverables.map((d, i) => (
                                                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                        <span className="text-brand-primary mt-1">•</span>
                                                        <span>{d}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contract Content */}
                            <div className="mb-12">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <FileSignature className="h-3.5 w-3.5 text-brand-primary" />
                                    Agreement Terms
                                </p>
                                <div
                                    className="prose prose-slate prose-headings:font-serif prose-p:font-serif max-w-none text-slate-800 dark:text-slate-200 leading-loose text-[14px]"
                                    dangerouslySetInnerHTML={{ __html: contract.content || '<p>No terms specified.</p>' }}
                                />
                            </div>

                            {/* Dates */}
                            <div className="flex flex-wrap gap-6 mb-12 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div>
                                    <span className="font-bold uppercase tracking-wider text-slate-400">Created</span>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{format(new Date(contract.created_at), 'MMMM d, yyyy')}</p>
                                </div>
                                {contract.sent_at && (
                                    <div>
                                        <span className="font-bold uppercase tracking-wider text-slate-400">Sent</span>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{format(new Date(contract.sent_at), 'MMM d, yyyy h:mm a')}</p>
                                    </div>
                                )}
                                {contract.signed_at && (
                                    <div>
                                        <span className="font-bold uppercase tracking-wider text-slate-400">Signed</span>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{format(new Date(contract.signed_at), 'MMM d, yyyy h:mm a')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Signature Block */}
                            {contract.status === 'Signed' && contract.signature_data && (
                                <div className="mt-10 pt-8 border-t-2 border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Client Signature</p>
                                        <div className="h-20 flex items-end justify-start mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                            <img src={contract.signature_data} alt="Signature" className="max-h-full max-w-full" />
                                        </div>
                                        <div className="border-t-2 border-slate-800 dark:border-slate-200 pt-2">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{contract.signer_name}</p>
                                            {contract.signer_email && <p className="text-xs text-slate-500">{contract.signer_email}</p>}
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold">
                                                <Shield className="h-2.5 w-2.5" /> Verified
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Service Provider</p>
                                        <div className="h-20 flex items-end justify-start mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                            <div className="italic text-3xl text-slate-800 dark:text-slate-200 opacity-70 pb-1" style={{ fontFamily: 'cursive' }}>
                                                {profile?.full_name || profile?.company_name}
                                            </div>
                                        </div>
                                        <div className="border-t-2 border-slate-800 dark:border-slate-200 pt-2">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{profile?.full_name || profile?.company_name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Authorized Representative</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
