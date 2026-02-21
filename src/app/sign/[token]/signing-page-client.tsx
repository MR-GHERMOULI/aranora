"use client"

import { useState, useEffect, useRef } from "react"
import { SignatureCanvas } from "@/components/contracts/signature-canvas"
import { CheckCircle, FileText, Loader2, AlertCircle, PenTool, ArrowDown, ShieldCheck } from "lucide-react"
import { DownloadContractButton } from "@/components/contracts/download-contract-button"

interface ContractData {
    id: string;
    title: string;
    content: string;
    status: string;
    signed_at?: string | null;
    signer_name?: string | null;
    created_at: string;
    client?: { name: string; email?: string | null } | null;
    project?: { title: string } | null;
    profile?: { full_name?: string; company_name?: string; logo_url?: string | null } | null;
}

interface SigningPageClientProps {
    contract: ContractData | null;
    token: string;
}

export default function SigningPageClient({ contract, token }: SigningPageClientProps) {
    const [signerName, setSignerName] = useState("")
    const [signerEmail, setSignerEmail] = useState("")
    const [signatureData, setSignatureData] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [signed, setSigned] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const signatureSectionRef = useRef<HTMLDivElement>(null)

    // Check if already signed
    useEffect(() => {
        if (contract?.status === 'Signed') {
            setSigned(true)
        }
    }, [contract])

    if (!contract) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Contract Not Found</h1>
                    <p className="text-slate-500">This signing link is invalid or has expired.</p>
                </div>
            </div>
        )
    }

    if (signed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-10 max-w-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
                    <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">Contract Executed!</h1>
                    <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                        {contract.signer_name
                            ? `Thank you, ${contract.signer_name}. The agreement has been signed legally and securely.`
                            : 'This contract has been signed successfully.'
                        }
                    </p>

                    <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <DownloadContractButton
                            contract={contract as any}
                            profile={contract.profile}
                        />
                        <p className="text-xs text-slate-500">
                            Download a PDF copy of the fully executed agreement for your records.
                        </p>
                    </div>

                    {contract.signed_at && (
                        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-[10px] uppercase font-bold tracking-widest">
                                Timestamp: {new Date(contract.signed_at).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    async function handleSign() {
        if (!signerName.trim()) {
            setError("Please enter your full legal name.")
            return
        }
        if (!signatureData) {
            setError("Please provide your signature.")
            return
        }

        setError(null)
        setLoading(true)

        try {
            const response = await fetch('/api/contracts/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    signerName: signerName.trim(),
                    signerEmail: signerEmail.trim() || null,
                    signatureData,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to sign contract')
            }

            setSigned(true)
        } catch (err: any) {
            setError(err.message || 'An error occurred while signing. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const providerName = contract.profile?.company_name || contract.profile?.full_name || 'Service Provider';

    const scrollToSignature = () => {
        signatureSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="min-h-screen bg-slate-100/50 pb-32">
            {/* Minimal Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {contract.profile?.logo_url && (
                            <img
                                src={contract.profile.logo_url}
                                alt="Logo"
                                className="h-10 w-10 rounded-xl object-contain bg-slate-50 border border-slate-100"
                            />
                        )}
                        <div>
                            <span className="text-sm font-bold text-slate-900 block">{providerName}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="h-3 w-3" /> Secure Document
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 lg:px-8 pt-10">

                {/* Title Section */}
                <div className="text-center mb-10 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4 leading-tight">
                        {contract.title}
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Please review the final agreement below. Once reviewed, provide your electronic signature at the bottom.
                    </p>
                </div>

                {/* Document Container */}
                <div className="bg-white shadow-2xl ring-1 ring-slate-900/5 min-h-[800px] mb-12 relative overflow-hidden">
                    {/* Top edge design */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary to-blue-600"></div>

                    <div className="p-8 md:p-16 lg:p-20">
                        {/* Parties */}
                        <div className="flex flex-col md:flex-row gap-8 mb-12 pb-12 border-b-2 border-slate-100">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Provider</p>
                                <p className="text-lg font-bold text-slate-900">{providerName}</p>
                            </div>
                            {contract.client && (
                                <div className="flex-1 md:text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Client</p>
                                    <p className="text-lg font-bold text-slate-900">{contract.client.name}</p>
                                    {contract.client.email && (
                                        <p className="text-sm text-slate-500">{contract.client.email}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="prose prose-slate prose-headings:font-serif prose-p:font-serif max-w-none text-slate-800 leading-loose prose-a:text-brand-primary whitespace-pre-wrap">
                            {contract.content}
                        </div>
                    </div>
                </div>

                {/* Signing Section */}
                <div ref={signatureSectionRef} className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-8 md:p-12 mb-12 border-t-4 border-brand-primary">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <PenTool className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Execute Agreement</h2>
                            <p className="text-slate-500 text-sm">Provide your details and signature to legally bind this contract.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Full Legal Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={signerName}
                                    onChange={(e) => setSignerName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Email Address <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={signerEmail}
                                    onChange={(e) => setSignerEmail(e.target.value)}
                                    placeholder="jane.doe@example.com"
                                    className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                <span>Signature <span className="text-red-500">*</span></span>
                            </label>
                            <SignatureCanvas onSignatureChange={setSignatureData} />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col md:flex-row items-center gap-6 justify-between">
                        <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                            By clicking <strong>"I Agree & Sign"</strong>, you confirm that you have read, understood, and agree to be bound by the terms of this contract. Your electronic signature is legally equivalent to a manual signature.
                        </p>
                        <button
                            onClick={handleSign}
                            disabled={loading || !signerName.trim() || !signatureData}
                            className="w-full md:w-auto px-8 h-14 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 shrink-0 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    I Agree & Sign
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </main>

            {/* Sticky Bottom Bar for quick action */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 md:hidden flex justify-center">
                <button
                    onClick={scrollToSignature}
                    className="w-full max-w-sm h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                    <ArrowDown className="h-4 w-4" />
                    Skip to Signature
                </button>
            </div>
        </div>
    )
}
