"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Share2, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { toggleShareToken, getShareToken } from "@/app/(dashboard)/projects/actions"

interface ShareProgressDialogProps {
    projectId: string
    projectTitle: string
}

export function ShareProgressDialog({ projectId, projectTitle }: ShareProgressDialogProps) {
    const [open, setOpen] = useState(false)
    const [shareToken, setShareToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
        if (open) {
            setInitialLoading(true)
            getShareToken(projectId)
                .then(token => setShareToken(token))
                .catch(() => { })
                .finally(() => setInitialLoading(false))
        }
    }, [open, projectId])

    const shareUrl = shareToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/progress/${shareToken}`
        : ""

    const handleToggle = async () => {
        setLoading(true)
        try {
            const result = await toggleShareToken(projectId)
            setShareToken(result.share_token)
            if (result.share_token) {
                toast.success("Sharing enabled! Copy the link to share with your client.")
            } else {
                toast.success("Sharing disabled. The link will no longer work.")
            }
        } catch {
            toast.error("Failed to update sharing settings.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!shareUrl) return
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success("Link copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Failed to copy link.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Progress
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-brand-primary" />
                        Share Project Progress
                    </DialogTitle>
                    <DialogDescription>
                        Share a live progress link with your client. They can see the project status without logging in.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="space-y-0.5">
                            <Label className="font-medium text-sm">Enable Sharing</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow anyone with the link to view progress
                            </p>
                        </div>
                        {initialLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Switch
                                checked={!!shareToken}
                                onCheckedChange={handleToggle}
                                disabled={loading}
                            />
                        )}
                    </div>

                    {/* Link */}
                    {shareToken && (
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Shareable Link
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={shareUrl}
                                    className="text-xs font-mono bg-muted/30"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs gap-2 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(shareUrl, "_blank")}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Preview as client
                            </Button>
                        </div>
                    )}

                    {/* Info */}
                    <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            <strong>What clients can see:</strong> Project title, status, task progress (title & status only).
                            No budget, files, or invoice data is shared.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
