"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { sendContract } from "@/app/(dashboard)/contracts/actions"
import { Send, Copy, Check, Loader2, Link as LinkIcon, Sparkles, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={isSent ? "outline" : "default"}
                    className={`h-9 px-4 font-bold rounded-xl transition-all gap-2 ${!isSent ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" : "border-slate-200"}`}
                >
                    {isSent ? <LinkIcon className="h-4 w-4 text-slate-400" /> : <Send className="h-4 w-4" />}
                    {isSent ? 'Signing Link' : 'Send to Client'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl gap-0">
                <div className="flex flex-col">

                    {/* ── Dark Header ── */}
                    <div className="bg-slate-900 text-white px-6 pt-6 pb-5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Send className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-tight">Secure Signing Link</h2>
                                <p className="text-slate-400 text-xs mt-0.5">Generate a unique URL for legally-binding e-signature.</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {signingUrl ? (
                                <motion.div
                                    key="ready"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                            <Check className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">Link Generated Successfully</p>
                                            <p className="text-xs text-emerald-700 font-medium">Any client with this link can sign the contract. No account required.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Secret URL</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <Input
                                                    readOnly
                                                    value={signingUrl}
                                                    className="h-11 px-4 text-xs font-mono bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleCopy}
                                                className={`h-11 w-24 rounded-xl font-bold transition-all ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                            >
                                                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                                {copied ? 'Copied' : 'Copy'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        <span>Encrypted & Legally Binding E-Signature</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="init"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                            <Sparkles className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Mark as &quot;Sent&quot;</p>
                                            <p className="text-xs text-blue-700 leading-relaxed font-medium">Generating a link will move this contract to the <span className="underline">Sent</span> status. The client can sign immediately upon opening.</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                                            <p className="text-xs font-semibold text-slate-600">Draft: &quot;{contractTitle}&quot;</p>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Final check: Ensure all smart data the client should see has been injected correctly before generating the link.</p>
                                    </div>

                                    <Button
                                        onClick={handleSend}
                                        disabled={loading}
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 gap-2 text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        Generate & Reveal Signing Link
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-slate-500 font-bold h-10 px-6"
                        >
                            {signingUrl ? 'Done' : 'Back'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
