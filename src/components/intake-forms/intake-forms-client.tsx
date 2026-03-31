"use client"

import { useState } from "react"
import { IntakeForm, IntakeSubmission } from "@/types"
import { format, formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Copy, Check, ExternalLink, MoreHorizontal, ArrowRight, Archive, Inbox, ClipboardList, Eye, Trash2, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { updateIntakeForm, deleteIntakeForm } from "@/app/(dashboard)/intake-forms/actions"
import { useRouter } from "next/navigation"

interface IntakeFormsClientProps {
    forms: IntakeForm[];
    submissions: IntakeSubmission[];
}

export function IntakeFormsClient({ forms, submissions }: IntakeFormsClientProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const router = useRouter()

    const copyLink = async (token: string, formId: string) => {
        const url = `${window.location.origin}/intake/${token}`
        await navigator.clipboard.writeText(url)
        setCopiedId(formId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleArchive = async (id: string) => {
        try {
            await updateIntakeForm(id, { status: 'archived' })
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this form and all its submissions? This cannot be undone.')) return
        try {
            await deleteIntakeForm(id)
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    const getFormSubmissions = (formId: string) => submissions.filter(s => s.form_id === formId)
    const getNewCount = (formId: string) => getFormSubmissions(formId).filter(s => s.status === 'new').length

    return (
        <>
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-rose-500/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        All Forms
                    </span>
                    <span className="ml-1 h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {forms.length}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            <TableHead className="font-semibold text-muted-foreground h-11 text-xs uppercase tracking-wider pl-5">Form</TableHead>
                            <TableHead className="font-semibold text-muted-foreground h-11 text-xs uppercase tracking-wider">Submissions</TableHead>
                            <TableHead className="font-semibold text-muted-foreground h-11 text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-semibold text-muted-foreground h-11 text-xs uppercase tracking-wider">Created</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground h-11 text-xs uppercase tracking-wider pr-5">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.map((form) => {
                            const newCount = getNewCount(form.id)
                            const statusConfig = form.status === 'active'
                                ? { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800", label: "Active" }
                                : { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400", label: "Archived" }

                            return (
                                <TableRow key={form.id} className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                    {/* Form Name */}
                                    <TableCell className="font-medium text-foreground py-3.5 pl-5">
                                        <Link href={`/intake-forms/${form.id}`} className="flex items-center gap-3 group/link">
                                            <div className="h-9 w-9 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 flex items-center justify-center border border-rose-500/10 shrink-0 group-hover/link:bg-rose-500/10 transition-colors">
                                                <ClipboardList className="h-4 w-4 text-rose-500/60 group-hover/link:text-rose-500 transition-colors" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-foreground group-hover/link:text-rose-600 transition-colors line-clamp-1">
                                                    {form.title}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-medium">
                                                    {form.fields.length} fields
                                                </span>
                                            </div>
                                        </Link>
                                    </TableCell>

                                    {/* Submissions */}
                                    <TableCell className="py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{form.submission_count}</span>
                                            {newCount > 0 && (
                                                <span className="h-5 min-w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-sm shadow-rose-500/30">
                                                    {newCount} new
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="py-3.5">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.badge}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`} />
                                            {statusConfig.label}
                                        </div>
                                    </TableCell>

                                    {/* Date */}
                                    <TableCell className="py-3.5">
                                        <div>
                                            <span className="text-sm text-foreground font-medium">
                                                {format(new Date(form.created_at), 'MMM d, yyyy')}
                                            </span>
                                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                                {formatDistanceToNow(new Date(form.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right py-3.5 pr-5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost" size="sm"
                                                className="h-8 px-3 text-xs font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-rose-600"
                                                onClick={() => copyLink(form.share_token, form.id)}
                                            >
                                                {copiedId === form.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
                                                {copiedId === form.id ? 'Copied!' : 'Copy Link'}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/intake-forms/${form.id}`}><Eye className="h-4 w-4 mr-2" /> View Details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => window.open(`/intake/${form.share_token}`, '_blank')}>
                                                        <ExternalLink className="h-4 w-4 mr-2" /> Preview Form
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {form.status === 'active' && (
                                                        <DropdownMenuItem onClick={() => handleArchive(form.id)}>
                                                            <Archive className="h-4 w-4 mr-2" /> Archive
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDelete(form.id)} className="text-red-600">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
