import { getTemplates } from "../actions";
import { TemplateDialog } from "@/components/contracts/template-dialog";
import { DeleteTemplateDialog } from "@/components/contracts/delete-template-dialog";
import { Button } from "@/components/ui/button";
import {
    FileText, Pencil, ArrowLeft, Clock, ShieldCheck,
    LayoutTemplate, Sparkles, DollarSign, Plus, Layers
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return (
        <div className="px-4 lg:px-8 space-y-8 pt-8 pb-16 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shrink-0"
                    >
                        <Link href="/contracts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20 shrink-0">
                            <LayoutTemplate className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Contract Templates
                            </h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage reusable templates for your contracts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* New Template CTA */}
                <div className="relative group shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-brand-primary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
                    <div className="relative">
                        <TemplateDialog />
                    </div>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {templates.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="col-span-full flex flex-col items-center justify-center py-28 text-center px-6">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-2xl scale-150" />
                            <div className="relative h-24 w-24 bg-white rounded-3xl shadow-lg flex items-center justify-center ring-1 ring-violet-500/10">
                                <Layers className="h-11 w-11 text-violet-500/70" />
                                <div className="absolute -top-1 -right-1 h-6 w-6 bg-violet-500 rounded-full flex items-center justify-center shadow">
                                    <Plus className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No templates yet</h3>
                        <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
                            Create reusable templates with smart defaults to speed up your contract creation workflow.
                        </p>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-brand-primary rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
                            <div className="relative">
                                <TemplateDialog />
                            </div>
                        </div>
                    </div>
                ) : (
                    templates.map((template) => {
                        const hasSmartData = !!template.contract_data;
                        const contractData = template.contract_data as any;

                        return (
                            <div
                                key={template.id}
                                className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Top accent bar */}
                                <div className="h-1 bg-gradient-to-r from-violet-400 via-brand-primary to-blue-500 rounded-t-2xl" />

                                {/* Card body */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    {/* Title row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-violet-500" />
                                            </div>
                                            <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                                                {template.name}
                                            </h3>
                                        </div>

                                        {/* Action buttons — revealed on hover */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <TemplateDialog
                                                template={template}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                }
                                            />
                                            <DeleteTemplateDialog templateId={template.id} templateName={template.name} />
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
                                        {template.content}
                                    </p>

                                    {/* Badges */}
                                    {hasSmartData && (
                                        <div className="flex flex-wrap gap-1.5">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-primary/10 to-violet-500/10 border border-brand-primary/15 text-brand-primary text-[10px] font-bold uppercase tracking-tight">
                                                <ShieldCheck className="h-2.5 w-2.5" />
                                                Smart Template
                                            </div>
                                            {contractData?.total_amount > 0 && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold">
                                                    <DollarSign className="h-2.5 w-2.5" />
                                                    {contractData.total_amount} {contractData.currency}
                                                </div>
                                            )}
                                            {contractData?.payment_type && (
                                                <div className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-150 text-slate-600 text-[10px] font-semibold uppercase">
                                                    {contractData.payment_type}
                                                </div>
                                            )}
                                            {contractData?.nda_included && (
                                                <div className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-semibold">
                                                    NDA
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                            <Clock className="h-3 w-3" />
                                            Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                                        </div>
                                        {hasSmartData && contractData?.revisions_included !== undefined && (
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {contractData.revisions_included} rev. included
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
