"use client"

import { Contract } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteContractDialog } from "@/components/contracts/delete-contract-dialog"
import { ShareContractDialog } from "@/components/contracts/share-contract-dialog"
import { ContractPreviewDialog } from "@/components/contracts/contract-preview-dialog"
import {
    FileSignature, CheckCircle, Send, Clock, Plus, ArrowRight, Sparkles, Eye
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"

interface ProjectContractsTabProps {
    contracts: Contract[]
    projectId: string
    projectTitle: string
    profile?: any
}

export function ProjectContractsTab({ contracts, projectId, projectTitle, profile }: ProjectContractsTabProps) {
    if (contracts.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-2xl scale-150" />
                            <div className="relative h-20 w-20 bg-white rounded-2xl shadow-lg flex items-center justify-center ring-1 ring-brand-primary/10">
                                <FileSignature className="h-9 w-9 text-brand-primary/60" />
                                <div className="absolute -top-1 -right-1 h-5 w-5 bg-brand-primary rounded-full flex items-center justify-center shadow">
                                    <Sparkles className="h-2.5 w-2.5 text-white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1.5">No contracts yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                            Create a professional contract for <strong>{projectTitle}</strong> to formalize your agreement with the client.
                        </p>
                        <Button asChild className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold gap-2 shadow-lg shadow-brand-primary/20">
                            <Link href={`/contracts?projectId=${projectId}`}>
                                <Plus className="h-4 w-4" />
                                Create Contract
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const statusConfig = (status: string) => {
        switch (status) {
            case 'Signed': return {
                dot: "bg-emerald-500",
                badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                icon: CheckCircle,
                accent: "border-l-emerald-500",
            }
            case 'Sent': return {
                dot: "bg-blue-500",
                badge: "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                icon: Send,
                accent: "border-l-blue-500",
            }
            default: return {
                dot: "bg-amber-400",
                badge: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                icon: Clock,
                accent: "border-l-amber-400",
            }
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Project Contracts
                    </span>
                    <span className="h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {contracts.length}
                    </span>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 font-semibold text-xs">
                    <Link href={`/contracts?projectId=${projectId}`}>
                        <Plus className="h-3.5 w-3.5" />
                        New Contract
                    </Link>
                </Button>
            </div>

            {/* Contract Cards */}
            <div className="grid gap-3">
                {contracts.map((contract) => {
                    const config = statusConfig(contract.status)
                    const StatusIcon = config.icon

                    return (
                        <Card
                            key={contract.id}
                            className={`group border-l-4 ${config.accent} hover:shadow-md transition-all bg-card overflow-hidden`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <Link
                                                href={`/contracts/${contract.id}`}
                                                className="text-sm font-bold text-foreground hover:text-brand-primary transition-colors truncate"
                                            >
                                                {contract.title}
                                            </Link>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${config.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                                                {contract.status}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {contract.client && (
                                                <span className="font-medium">{contract.client.name}</span>
                                            )}
                                            <span>•</span>
                                            <span>{format(new Date(contract.created_at), 'MMM d, yyyy')}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="hidden sm:inline">
                                                {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ContractPreviewDialog contract={contract} profile={profile} />
                                        <ShareContractDialog
                                            contractId={contract.id}
                                            contractTitle={contract.title}
                                            existingToken={contract.signing_token}
                                            status={contract.status}
                                            clientEmail={contract.client?.email}
                                        />
                                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-semibold hover:text-brand-primary">
                                            <Link href={`/contracts/${contract.id}`}>
                                                View
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Link>
                                        </Button>
                                        <DeleteContractDialog contractId={contract.id} contractTitle={contract.title} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
