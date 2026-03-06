"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Share2, Copy, Check, ExternalLink, Loader2, ShieldCheck, Mail, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { sendContract } from "@/app/(dashboard)/contracts/actions"

interface ShareContractDialogProps {
    contractId: string
    contractTitle: string
    existingToken?: string | null
    status?: string
    clientEmail?: string | null
}

export function ShareContractDialog({
    contractId,
    contractTitle,
    existingToken,
    status,
    clientEmail,
}: ShareContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [signingToken, setSigningToken] = useState<string | null>(existingToken || null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const isActive = !!signingToken
    const shareUrl = signingToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${signingToken}`
        : ""

    const handleToggle = async () => {
        if (isActive) {
            // Already enabled — nothing to do (we don't support disabling for legal reasons)
            toast.info("Signing link is already active. Share it with your client.")
            return
        }

        setLoading(true)
        try {
            const token = await sendContract(contractId)
            setSigningToken(token)
            toast.success("Signing link generated! Share it with your client.")
        } catch {
            toast.error("Failed to generate signing link.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!shareUrl) return
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success("Signing link copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Failed to copy link.")
        }
    }

    const handleEmail = () => {
        const subject = encodeURIComponent(`Contract for Signature: ${contractTitle}`)
        const body = encodeURIComponent(
            `Hello,\n\nPlease review and sign the following contract:\n\n"${contractTitle}"\n\nClick the link below to open the contract and sign it directly in your browser:\n${shareUrl}\n\nNo account is required. Simply open the link, review the document, and provide your electronic signature.\n\nThank you.`
        )
        const mailto = clientEmail
            ? `mailto:${clientEmail}?subject=${subject}&body=${body}`
            : `mailto:?subject=${subject}&body=${body}`
        window.open(mailto, '_blank')
    }

    const isSigned = status === 'Signed'

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share for Signing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-brand-primary" />
                        Share Contract for Signing
                    </DialogTitle>
                    <DialogDescription>
                        Share a secure signing link with your client. They can read the contract and sign it directly in their browser — no account required.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">

                    {/* Status indicator for already signed */}
                    {isSigned && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Check className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Contract Signed</p>
                                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">This contract has been fully executed by the client.</p>
                            </div>
                        </div>
                    )}

                    {/* Toggle */}
                    {!isSigned && (
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                            <div className="space-y-0.5">
                                <Label className="font-medium text-sm">Enable Signing Link</Label>
                                <p className="text-xs text-muted-foreground">
                                    Allow your client to sign the contract via a unique link
                                </p>
                            </div>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={handleToggle}
                                    disabled={loading || isActive}
                                />
                            )}
                        </div>
                    )}

                    {/* Link */}
                    {signingToken && (
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Secure Signing Link
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

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs gap-2 text-muted-foreground hover:text-foreground hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10"
                                    onClick={handleEmail}
                                >
                                    <Mail className="h-3.5 w-3.5" />
                                    Send via Email
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs gap-2 text-muted-foreground hover:text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10"
                                    onClick={() => window.open(shareUrl, "_blank")}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Preview as client
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            <strong>How it works:</strong> The client opens the link in any browser, reviews the full contract,
                            provides their name, and draws their signature using a finger or pen. The signed contract is saved
                            with a verified timestamp and IP address.
                        </p>
                    </div>

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Encrypted & Legally Binding</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
