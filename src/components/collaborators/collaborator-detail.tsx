"use client"

import { CollaboratorCRM, CollaboratorPayment } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Star,
    Mail,
    Phone,
    ExternalLink,
    MapPin,
    Calendar as CalendarIcon,
    Briefcase,
    DollarSign,
    MessageSquare,
    Link as LinkIcon,
    Plus,
    Clock
} from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { AddPaymentDialog } from "./add-payment-dialog"

interface CollaboratorDetailProps {
    collaborator: CollaboratorCRM
    projectHistory: any[]
    payments: CollaboratorPayment[]
}

export function CollaboratorDetail({
    collaborator,
    projectHistory,
    payments
}: CollaboratorDetailProps) {
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar / Overview */}
            <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-cyan-500/5 bg-gradient-to-b from-card to-muted/20">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 border border-cyan-500/20">
                            <span className="text-4xl font-bold text-cyan-600">
                                {collaborator.full_name.charAt(0)}
                            </span>
                        </div>
                        <CardTitle className="text-2xl font-bold">{collaborator.full_name}</CardTitle>
                        <div className="flex justify-center items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < (collaborator.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                />
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 pt-4 border-t border-muted">
                            {collaborator.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-muted rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                                    <span className="font-medium truncate">{collaborator.email}</span>
                                </div>
                            )}
                            {collaborator.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-muted rounded-lg"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                                    <span className="font-medium">{collaborator.phone}</span>
                                </div>
                            )}
                            {collaborator.whatsapp && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-green-500/10 rounded-lg"><MessageSquare className="h-4 w-4 text-green-600" /></div>
                                    <span className="font-medium">{collaborator.whatsapp} (WhatsApp)</span>
                                </div>
                            )}
                            {collaborator.country && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-muted rounded-lg"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                                    <span className="font-medium">{collaborator.country}</span>
                                </div>
                            )}
                            {collaborator.date_of_birth && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-muted rounded-lg"><CalendarIcon className="h-4 w-4 text-muted-foreground" /></div>
                                    <span className="font-medium">{format(new Date(collaborator.date_of_birth), "PPP")}</span>
                                </div>
                            )}
                            {collaborator.platform_profile_link && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-muted rounded-lg"><LinkIcon className="h-4 w-4 text-muted-foreground" /></div>
                                    <a
                                        href={collaborator.platform_profile_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-600 hover:underline font-medium truncate"
                                    >
                                        Platform Profile
                                    </a>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-emerald-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Financial Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">
                            ${totalPayments.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total lifetime payments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Areas */}
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="projects" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-12">
                        <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Projects</TabsTrigger>
                        <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Payments</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Evaluation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="projects" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-cyan-600" />
                                Project Involvement
                            </h3>
                            <Badge variant="secondary">{projectHistory.length} Projects</Badge>
                        </div>

                        {projectHistory.length === 0 ? (
                            <div className="text-center py-10 bg-muted/20 border-2 border-dashed rounded-2xl">
                                <p className="text-sm text-muted-foreground">No shared projects found on this platform.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {projectHistory.map((item: any) => (
                                    <Card key={item.id} className="group hover:bg-muted/30 transition-colors border-none bg-card/50">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                                    <Briefcase className="h-5 w-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{item.projects?.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <Badge variant="outline" className="text-[10px] h-4">
                                                            {item.projects?.status}
                                                        </Badge>
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="h-3 w-3" />
                                                            {item.revenue_share}% share
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/projects/${item.projects?.id}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="payments" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                Payment History
                            </h3>
                            <AddPaymentDialog collaboratorId={collaborator.id} />
                        </div>

                        {payments.length === 0 ? (
                            <div className="text-center py-10 bg-muted/20 border-2 border-dashed rounded-2xl">
                                <p className="text-sm text-muted-foreground">No payments recorded for this collaborator.</p>
                            </div>
                        ) : (
                            <div className="border rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Date</th>
                                            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Description</th>
                                            <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(payment.payment_date), "MMM d, yyyy")}
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {payment.description || "Project Payment"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                                                    ${payment.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6">
                        <Card className="border-none shadow-sm bg-muted/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Internal Evaluation</CardTitle>
                                <CardDescription>Private notes and thoughts about this collaborator.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {collaborator.notes ? (
                                        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground italic bg-background/50 p-6 rounded-2xl border border-muted-foreground/10">
                                            &quot;{collaborator.notes}&quot;
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground italic text-center py-10">No specific evaluation recorded yet.</p>
                                    )}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button variant="outline" className="gap-2">
                                        Edit Evaluation
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
