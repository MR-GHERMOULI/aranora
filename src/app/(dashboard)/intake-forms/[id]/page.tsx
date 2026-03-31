import { getIntakeForm, getSubmissions } from "../actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ClipboardList, ArrowLeft, Inbox, Eye, CheckCircle,
    TrendingUp, Copy, ExternalLink, Link as LinkIcon,
    Archive, Calendar, FileText, Users
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { IntakeFormDetailClient } from "@/components/intake-forms/intake-form-detail-client";

export default async function IntakeFormDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [form, submissions] = await Promise.all([
        getIntakeForm(id),
        getSubmissions(id)
    ]);

    if (!form) {
        redirect('/intake-forms');
    }

    const newCount = submissions.filter(s => s.status === 'new').length;
    const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
    const convertedCount = submissions.filter(s => s.status === 'converted').length;

    return (
        <div className="px-4 lg:px-8 space-y-8 pt-8 pb-16 max-w-7xl mx-auto">

            {/* Back + Header */}
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
                    <Link href="/intake-forms">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back to Intake Forms
                    </Link>
                </Button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center ring-1 ring-rose-500/20 shrink-0">
                            <ClipboardList className="h-6 w-6 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                {form.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${form.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {form.status === 'active' ? 'Active' : 'Archived'}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Created {format(new Date(form.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Submissions", value: submissions.length, icon: Inbox, iconColor: "text-violet-600", iconBg: "bg-violet-500/10" },
                    { label: "New / Unreviewed", value: newCount, icon: Eye, iconColor: "text-amber-600", iconBg: "bg-amber-500/10" },
                    { label: "Reviewed", value: reviewedCount, icon: CheckCircle, iconColor: "text-blue-600", iconBg: "bg-blue-500/10" },
                    { label: "Converted", value: convertedCount, icon: TrendingUp, iconColor: "text-emerald-600", iconBg: "bg-emerald-500/10" },
                ].map((m, i) => {
                    const Icon = m.icon;
                    return (
                        <Card key={i} className="border-border bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.label}</CardTitle>
                                <div className={`h-8 w-8 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                                    <Icon className={`h-4 w-4 ${m.iconColor}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="text-2xl font-bold text-foreground tabular-nums">{m.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Submissions */}
            <IntakeFormDetailClient form={form} submissions={submissions} />
        </div>
    );
}
