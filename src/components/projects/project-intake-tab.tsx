"use client"

import { IntakeForm, IntakeSubmission, IntakeFormField } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    ClipboardList, Plus, ArrowRight, Sparkles, Eye, Calendar, User, 
    Building, Inbox, CheckCircle, TrendingUp, Search, Link as LinkIcon, 
    Copy, ExternalLink, MoreHorizontal, Archive, Trash2, Printer, 
    Mail, Phone, Building2, MessageSquare, ChevronRight, X, Check
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { getIntakeForms, getSubmissions, deleteIntakeForm, updateIntakeForm, linkSubmissionToProject, updateSubmissionStatus } from "@/app/(dashboard)/intake-forms/actions"
import { FormBuilder } from "@/components/intake-forms/form-builder"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProjectIntakeTabProps {
    submissions: IntakeSubmission[]
    forms: IntakeForm[]
    allSubmissions: IntakeSubmission[] 
    projectId: string
    projectTitle: string
}

export function ProjectIntakeTab({ submissions, forms, allSubmissions, projectId, projectTitle }: ProjectIntakeTabProps) {
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedSubmission, setSelectedSubmission] = useState<IntakeSubmission | null>(null)
    const [internalNotes, setInternalNotes] = useState("")
    const [updating, setUpdating] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const router = useRouter()

    const unlinkedSubmissions = allSubmissions.filter(s => 
        !submissions.find(ps => ps.id === s.id) && s.converted_project_id !== projectId
    )

    const filteredSubmissions = statusFilter === 'all'
        ? submissions
        : submissions.filter(s => s.status === statusFilter)

    const handleLink = async () => {
        if (!selectedSubmissionId) return
        setIsSubmitting(true)
        try {
            await linkSubmissionToProject(selectedSubmissionId, projectId)
            toast.success("Submission linked successfully")
            setIsLinkDialogOpen(false)
            setSelectedSubmissionId(null)
            router.refresh()
        } catch (error) {
            toast.error("Failed to link submission")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStatusUpdate = async (id: string, status: 'reviewed' | 'converted' | 'archived') => {
        setUpdating(true)
        try {
            await updateSubmissionStatus(id, status, internalNotes || undefined)
            toast.success(`Submission marked as ${status}`)
            router.refresh()
            if (status === 'archived') setSelectedSubmission(null)
        } catch (e) {
            toast.error("Failed to update status")
        } finally {
            setUpdating(false)
        }
    }

    const copyLink = async (token: string, formId: string) => {
        const url = `${window.location.origin}/intake/${token}`
        await navigator.clipboard.writeText(url)
        setCopiedId(formId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
        new: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400", label: "New" },
        reviewed: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400", label: "Reviewed" },
        converted: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400", label: "Converted" },
        archived: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400", label: "Archived" },
    }

    const renderResponseValue = (fieldId: string, value: any, formFields: IntakeFormField[]) => {
        const field = formFields.find(f => f.id === fieldId)
        const type = field?.type || 'text'

        if (value === null || value === undefined || value === '') return <span className="text-slate-400 italic text-xs">Not provided</span>

        if (type === 'multiselect' && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((v, i) => <Badge key={i} variant="secondary" className="px-1.5 py-0 text-[10px]">{v}</Badge>)}
                </div>
            )
        }

        if (type === 'budget_range' && typeof value === 'object') {
            return <span className="text-sm font-bold text-slate-900 dark:text-slate-100">${value.min?.toLocaleString()} - ${value.max?.toLocaleString()} {value.currency}</span>
        }

        return <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{String(value)}</span>
    }

    const handlePrint = () => {
        if (!selectedSubmission || !selectedSubmission.form) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Intake: ${selectedSubmission.client_name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        h1 { color: #000; border-bottom: 2px solid #eee; padding-bottom: 15px; }
                        .section { margin-bottom: 30px; }
                        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                        .value { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    <h1>Intake Submission: ${selectedSubmission.client_name}</h1>
                    <div class="section">
                        <div class="label">Date</div><div class="value">${new Date(selectedSubmission.submitted_at).toLocaleString()}</div>
                        <div class="label">Email</div><div class="value">${selectedSubmission.client_email || 'N/A'}</div>
                        <div class="label">Company</div><div class="value">${selectedSubmission.client_company || 'N/A'}</div>
                    </div>
                    <div class="section">
                        <h2>Responses</h2>
                        ${selectedSubmission.form.fields.filter(f => f.type !== 'section_header').map(f => `
                            <div class="label">${f.label}</div>
                            <div class="value">${JSON.stringify(selectedSubmission.responses[f.id])}</div>
                        `).join('')}
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Project-Specific Metrics */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Submissions", value: submissions.length, icon: Inbox, color: "text-violet-600", bg: "bg-violet-500/10" },
                    { label: "New Responses", value: submissions.filter(s => s.status === 'new').length, icon: Eye, color: "text-amber-600", bg: "bg-amber-500/10" },
                    { label: "Reviewed Info", value: submissions.filter(s => s.status === 'reviewed').length, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Converted", value: submissions.filter(s => s.status === 'converted').length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                ].map((m, i) => (
                    <Card key={i} className="border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</CardTitle>
                            <div className={`h-8 w-8 rounded-xl ${m.bg} flex items-center justify-center`}>
                                <m.icon className={`h-4 w-4 ${m.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="text-2xl font-bold text-foreground">{m.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="submissions" className="w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <TabsList className="bg-muted/50 border border-border p-1">
                        <TabsTrigger value="submissions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
                            Submissions
                        </TabsTrigger>
                        <TabsTrigger value="forms" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
                            Form Templates
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                         <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-sm transition-all">
                                    <Plus className="h-4 w-4" />
                                    Link Existing Submission
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Link Intake Submission</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    {unlinkedSubmissions.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No available submissions to link.</p>
                                        </div>
                                    ) : (
                                        <div className="h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                            <div className="space-y-2">
                                                {unlinkedSubmissions.map((s) => (
                                                    <div 
                                                        key={s.id}
                                                        onClick={() => setSelectedSubmissionId(s.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                            selectedSubmissionId === s.id 
                                                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 shadow-md' 
                                                            : 'border-border bg-card hover:border-border/80 hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-sm text-foreground">{s.form?.title || 'Unknown Form'}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{format(new Date(s.submitted_at), 'MMM d, yyyy')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1"><User className="h-3 w-3" /> {s.client_name}</div>
                                                            {s.client_company && <div className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {s.client_company}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
                                    <Button 
                                        disabled={!selectedSubmissionId || isSubmitting} 
                                        onClick={handleLink}
                                        className="bg-brand-primary"
                                    >
                                        {isSubmitting ? "Linking..." : "Link Submission"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* SUBMISSIONS TAB */}
                <TabsContent value="submissions" className="space-y-6">
                    <Card className="border-border shadow-sm overflow-hidden bg-card/50">
                        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-rose-500/60" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Submissions</span>
                                <span className="ml-1 h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                                    {submissions.length}
                                </span>
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                                {['all', 'new', 'reviewed', 'converted', 'archived'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm ${statusFilter === status ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border/50'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredSubmissions.length === 0 ? (
                            <div className="py-24 text-center px-6">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-2xl scale-150 mx-auto w-24 h-24" />
                                    <Inbox className="h-12 w-12 text-slate-300 mx-auto relative opacity-40" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground mb-1">No submissions found</h4>
                                <p className="text-xs text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                                    No submissions match the selected status or no forms have been linked to this project yet.
                                </p>
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
                                            className="flex items-center gap-4 px-5 py-5 hover:bg-muted/50 transition-all cursor-pointer group"
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-transparent">
                                                {sub.client_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-foreground group-hover:text-rose-600 transition-colors">{sub.client_name}</span>
                                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.badge}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} shrink-0`} />
                                                        {sc.label}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                    <span className="truncate max-w-[150px]">{sub.client_email}</span>
                                                    {sub.client_company && <span className="opacity-40">• {sub.client_company}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 hidden sm:block mr-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                    {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* FORMS TAB */}
                <TabsContent value="forms">
                    <Card className="border-border shadow-sm overflow-hidden bg-card/50">
                        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-rose-500/60" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Forms</span>
                                <span className="ml-1 h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                                    {forms.length}
                                </span>
                            </div>
                            <FormBuilder onCreated={() => router.refresh()} />
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border">
                                        <TableHead className="font-bold text-muted-foreground h-11 text-[10px] uppercase tracking-wider pl-5">Form Title</TableHead>
                                        <TableHead className="font-bold text-muted-foreground h-11 text-[10px] uppercase tracking-wider text-center">Fields</TableHead>
                                        <TableHead className="text-right font-bold text-muted-foreground h-11 text-[10px] uppercase tracking-wider pr-5">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forms.map((form) => (
                                        <TableRow key={form.id} className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 h-16">
                                            <TableCell className="pl-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/10 shrink-0">
                                                        <ClipboardList className="h-4 w-4 text-rose-500/60" />
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground">{form.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                                {form.fields.length}
                                            </TableCell>
                                            <TableCell className="text-right pr-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-8 px-3 text-[10px] uppercase tracking-widest font-bold gap-2 text-muted-foreground hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                                        onClick={() => copyLink(form.share_token, form.id)}
                                                    >
                                                        {copiedId === form.id ? <Check className="h-3 w-3 text-emerald-500" /> : <LinkIcon className="h-3 w-3" />}
                                                        {copiedId === form.id ? 'Copied' : 'Link'}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-rose-500/10 hover:text-rose-600 transition-all" asChild>
                                                        <Link href={`/intake-forms/${form.id}`}><Eye className="h-4 w-4" /></Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submission Detail Dialog (Synced with main section) */}
            <Dialog open={!!selectedSubmission} onOpenChange={(v) => { if (!v) setSelectedSubmission(null) }}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl gap-0 max-h-[95vh] rounded-2xl">
                    {selectedSubmission && (
                        <div className="flex flex-col max-h-[95vh]">
                            {/* Premium Header */}
                            <div className="bg-slate-900 text-white px-8 pt-8 pb-6 shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-slate-800/50">
                                            {selectedSubmission.client_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold tracking-tight">{selectedSubmission.client_name}</h3>
                                            <p className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" />
                                                Submitted {format(new Date(selectedSubmission.submitted_at), 'PPP')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusConfig[selectedSubmission.status]?.badge} border-none`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[selectedSubmission.status]?.dot}`} />
                                            {statusConfig[selectedSubmission.status]?.label}
                                        </div>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-9 w-9 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                            onClick={handlePrint}
                                        >
                                            <Printer className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-card dark:bg-slate-950 custom-scrollbar">
                                {/* Quick Contacts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: Mail, label: "Email Address", value: selectedSubmission.client_email },
                                        { icon: Phone, label: "Phone Number", value: selectedSubmission.client_phone },
                                        { icon: Building2, label: "Organization", value: selectedSubmission.client_company },
                                    ].filter(c => c.value).map((c, i) => (
                                        <div key={i} className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <c.icon className="h-3 w-3" /> {c.label}
                                            </span>
                                            <span className="text-sm font-bold text-foreground truncate">{c.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Form Responses */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Responses</p>
                                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                                            {selectedSubmission.form?.title}
                                        </Badge>
                                    </div>
                                    <div className="grid gap-3">
                                        {selectedSubmission.form?.fields.filter(f => f.type !== 'section_header').map((field) => {
                                            const value = selectedSubmission.responses[field.id]
                                            return (
                                                <div key={field.id} className="group p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-border transition-all">
                                                    <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">{field.label}</p>
                                                    <div className="font-medium">
                                                        {renderResponseValue(field.id, value, selectedSubmission.form?.fields || [])}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Notes Area */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> Internal Workspace Notes
                                    </p>
                                    <Textarea
                                        placeholder="Add your private thoughts or follow-up notes here..."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        className="min-h-[100px] bg-white dark:bg-slate-900 border-border rounded-xl text-sm leading-relaxed shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between px-8 py-5 border-t border-border bg-muted/30 shrink-0">
                                <Button
                                    variant="ghost" size="sm"
                                    onClick={() => handleStatusUpdate(selectedSubmission.id, 'archived')}
                                    className="text-slate-400 hover:text-red-500 gap-2 font-bold transition-all"
                                    disabled={updating}
                                >
                                    <Archive className="h-4 w-4" /> Archive
                                </Button>
                                <div className="flex items-center gap-3">
                                    {selectedSubmission.status !== 'reviewed' && selectedSubmission.status !== 'converted' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleStatusUpdate(selectedSubmission.id, 'reviewed')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl gap-2 shadow-lg shadow-blue-500/20"
                                            disabled={updating}
                                        >
                                            <Eye className="h-4 w-4" /> Mark Reviewed
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        asChild
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Link href={`/contracts?fromIntake=${selectedSubmission.id}&projectId=${projectId}`}>
                                            <Sparkles className="h-4 w-4" /> Create Contract
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
