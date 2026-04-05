"use client"

import { IntakeSubmission } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus, ArrowRight, Sparkles, Eye, Calendar, User, Building } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter 
} from "@/components/ui/dialog"
import { linkSubmissionToProject } from "@/app/(dashboard)/intake-forms/actions"
import { toast } from "sonner"

interface ProjectIntakeTabProps {
    submissions: IntakeSubmission[]
    allSubmissions: IntakeSubmission[] // All submissions for the user to pick from
    projectId: string
    projectTitle: string
}

export function ProjectIntakeTab({ submissions, allSubmissions, projectId, projectTitle }: ProjectIntakeTabProps) {
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const unlinkedSubmissions = allSubmissions.filter(s => 
        !submissions.find(ps => ps.id === s.id) && s.converted_project_id !== projectId
    )

    const handleLink = async () => {
        if (!selectedSubmissionId) return
        
        setIsSubmitting(true)
        try {
            await linkSubmissionToProject(selectedSubmissionId, projectId)
            toast.success("Submission linked", {
                description: "The intake form has been successfully linked to this project."
            })
            setIsLinkDialogOpen(false)
            setSelectedSubmissionId(null)
        } catch (error) {
            toast.error("Error", {
                description: "Failed to link submission. Please try again."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submissions.length === 0) {
        return (
            <div className="space-y-6">
                <Card className="border-dashed">
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-2xl scale-150" />
                                <div className="relative h-20 w-20 bg-white rounded-2xl shadow-lg flex items-center justify-center ring-1 ring-rose-500/10">
                                    <ClipboardList className="h-9 w-9 text-rose-500/60" />
                                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center shadow">
                                        <Sparkles className="h-2.5 w-2.5 text-white" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1.5">No intake forms linked</h3>
                            <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
                                Link an existing intake submission to <strong>{projectTitle}</strong> to keep all discovery data in one place.
                            </p>
                            
                            <div className="flex gap-3">
                                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold gap-2 shadow-lg shadow-rose-500/20">
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
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    No available submissions to link. 
                                                    Create a form and share it with your client first.
                                                </div>
                                            ) : (
                                                <div className="h-[300px] overflow-y-auto pr-4">
                                                    <div className="space-y-2">
                                                        {unlinkedSubmissions.map((s) => (
                                                            <div 
                                                                key={s.id}
                                                                onClick={() => setSelectedSubmissionId(s.id)}
                                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                                    selectedSubmissionId === s.id 
                                                                    ? 'border-rose-500 bg-rose-50' 
                                                                    : 'border-transparent hover:bg-muted'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-bold text-sm">{s.form?.title || 'Unknown Form'}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(s.submitted_at), 'MMM d, yyyy')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <User className="h-3 w-3" /> {s.client_name}
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

                                <Button variant="outline" asChild className="font-semibold">
                                    <Link href="/intake-forms">
                                        Manage Forms
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Linked Submissions
                    </span>
                    <span className="h-5 min-w-5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {submissions.length}
                    </span>
                </div>
                
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 font-semibold text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                            <Plus className="h-3.5 w-3.5" />
                            Link Submission
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Link Intake Submission</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            {unlinkedSubmissions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No more available submissions to link.
                                </div>
                            ) : (
                                <div className="h-[300px] overflow-y-auto pr-4">
                                    <div className="space-y-2">
                                        {unlinkedSubmissions.map((s) => (
                                            <div 
                                                key={s.id}
                                                onClick={() => setSelectedSubmissionId(s.id)}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                    selectedSubmissionId === s.id 
                                                    ? 'border-rose-500 bg-rose-50' 
                                                    : 'border-transparent hover:bg-muted'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm">{s.form?.title || 'Unknown Form'}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(s.submitted_at), 'MMM d, yyyy')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" /> {s.client_name}
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

            <div className="grid gap-4">
                {submissions.map((submission) => (
                    <Card key={submission.id} className="group border-l-4 border-l-rose-500 hover:shadow-md transition-all bg-card overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-foreground group-hover:text-rose-600 transition-colors">
                                            {submission.form?.title || "Project Intake Form"}
                                        </h4>
                                        {submission.status === 'new' && (
                                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold uppercase tracking-wider">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3 w-3" />
                                            {submission.client_name}
                                        </div>
                                        {submission.client_company && (
                                            <div className="flex items-center gap-1.5">
                                                <Building className="h-3 w-3" />
                                                {submission.client_company}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs font-semibold hover:border-rose-300 hover:text-rose-600">
                                        <Link href={`/intake-forms/submissions/${submission.id}`}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            View Responses
                                            <ArrowRight className="ml-1.5 h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
