"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { sendContract } from "@/app/(dashboard)/contracts/actions"
import { Send, Copy, Check, Loader2, Link as LinkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SendContractDialogProps {
    contractId: string;
    contractTitle: string;
    existingToken?: string | null;
    status?: string;
}

export function SendContractDialog({ contractId, contractTitle, existingToken, status }: SendContractDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [signingToken, setSigningToken] = useState<string | null>(existingToken || null)
    const [copied, setCopied] = useState(false)

    const signingUrl = signingToken
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${signingToken}`
        : null;

    async function handleSend() {
        setLoading(true)
        try {
            const token = await sendContract(contractId)
            setSigningToken(token)
        } catch (error) {
            console.error(error)
            alert("Failed to send contract")
        } finally {
            setLoading(false)
        }
    }

    async function handleCopy() {
        if (signingUrl) {
            await navigator.clipboard.writeText(signingUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const isSent = status === 'Sent' || status === 'Signed';

    return (
        <>
            <Button
                variant={isSent ? "outline" : "default"}
                onClick={() => setOpen(true)}
                className={!isSent ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
                {isSent ? <LinkIcon className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {isSent ? 'Signing Link' : 'Send to Client'}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-600" />
                            Send Contract to Client
                        </DialogTitle>
                        <DialogDescription>
                            Generate a unique signing link for &quot;{contractTitle}&quot;. The client can open this link on any device to read and sign the contract — no login required.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {signingUrl ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 mb-2">✅ Signing link is ready!</p>
                                    <p className="text-xs text-green-600">Share this link with your client. They can sign directly from their browser.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={signingUrl}
                                        className="text-xs font-mono bg-gray-50"
                                    />
                                    <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0">
                                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Clicking &quot;Generate Link&quot; will mark this contract as <strong>Sent</strong> and create a unique signing URL.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Signing Link
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
