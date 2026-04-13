import { getIntakeForms, getSubmissions } from "./actions";
import { FormBuilder } from "@/components/intake-forms/form-builder";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ClipboardList, Inbox, Eye, TrendingUp, Sparkles
} from "lucide-react";
import { IntakeFormsClient } from "@/components/intake-forms/intake-forms-client";

export default async function IntakeFormsPage() {
    const [forms, allSubmissions] = await Promise.all([
        getIntakeForms(),
        getSubmissions()
    ]);

    const totalSubmissions = allSubmissions.length;
    const newSubmissions = allSubmissions.filter(s => s.status === 'new').length;
    const convertedSubmissions = allSubmissions.filter(s => s.status === 'converted').length;
    const conversionRate = totalSubmissions > 0 ? Math.round((convertedSubmissions / totalSubmissions) * 100) : 0;
    const activeForms = forms.filter(f => f.status === 'active').length;

    const metrics = [
        {
            label: "Active Forms",
            value: activeForms,
            sub: `${forms.length} total created`,
            icon: ClipboardList,
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-600",
            accent: "from-rose-500/20 to-transparent",
            border: "border-rose-100",
        },
        {
            label: "Total Submissions",
            value: totalSubmissions,
            sub: "All time responses",
            icon: Inbox,
            iconBg: "bg-violet-500/10",
            iconColor: "text-violet-600",
            accent: "from-violet-500/20 to-transparent",
            border: "border-violet-100",
        },
        {
            label: "New / Unreviewed",
            value: newSubmissions,
            sub: "Awaiting your review",
            icon: Eye,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600",
            accent: "from-amber-500/20 to-transparent",
            border: "border-amber-100",
        },
        {
            label: "Conversion Rate",
            value: `${conversionRate}%`,
            sub: `${convertedSubmissions} converted`,
            icon: TrendingUp,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            accent: "from-emerald-500/20 to-transparent",
            border: "border-emerald-100",
        },
    ];

    return (
        <div className="px-4 lg:px-8 space-y-8 pt-8 pb-16 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center ring-1 ring-rose-500/20 shrink-0">
                        <ClipboardList className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Client Intake Forms
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Create professional questionnaires, collect client requirements, and convert to contracts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <SubscriptionGate>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
                            <div className="relative">
                                <FormBuilder />
                            </div>
                        </div>
                    </SubscriptionGate>
                </div>
            </div>

            {/* Metric Cards */}
            {forms.length > 0 && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {metrics.map((m, i) => {
                        const Icon = m.icon;
                        return (
                            <Card
                                key={i}
                                className={`relative overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${m.border} dark:border-border`}
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.accent}`} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {m.label}
                                    </CardTitle>
                                    <div className={`h-8 w-8 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                                        <Icon className={`h-4 w-4 ${m.iconColor}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-5">
                                    <div className="text-2xl font-bold text-foreground tabular-nums">
                                        {m.value}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">{m.sub}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Forms Table / Empty State */}
            <Card className="border-border shadow-sm overflow-hidden bg-card">
                {forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center px-6">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-2xl scale-150" />
                            <div className="relative h-24 w-24 bg-white dark:bg-slate-900 rounded-3xl shadow-lg flex items-center justify-center ring-1 ring-rose-500/10">
                                <ClipboardList className="h-11 w-11 text-rose-500/70" />
                                <div className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 rounded-full flex items-center justify-center shadow">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No intake forms yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
                            Create a professional intake form to collect client requirements before starting any project. Send a link — clients fill it out — you get structured data.
                        </p>
                        <SubscriptionGate>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
                                <div className="relative">
                                    <FormBuilder />
                                </div>
                            </div>
                        </SubscriptionGate>
                    </div>
                ) : (
                    <IntakeFormsClient forms={forms} submissions={allSubmissions} />
                )}
            </Card>
        </div>
    );
}
