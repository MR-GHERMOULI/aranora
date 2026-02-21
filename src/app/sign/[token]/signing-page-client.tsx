"use client"

import { useState, useEffect } from "react"
import { SignatureCanvas } from "@/components/contracts/signature-canvas"
import { CheckCircle, FileText, Loader2, AlertCircle, PenTool } from "lucide-react"
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

    // Check if already signed
    useEffect(() => {
        if (contract?.status === 'Signed') {
            setSigned(true)
        }
    }, [contract])

    if (!contract) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Contract Not Found</h1>
                    <p className="text-gray-500">This signing link is invalid or has expired.</p>
                </div>
            </div>
        )
    }

    if (signed) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Signed!</h1>
                    <p className="text-gray-500 mb-6">
                        {contract.signer_name
                            ? `Signed by ${contract.signer_name}`
                            : 'This contract has been signed successfully.'
                        }
                    </p>

                    <div className="flex flex-col gap-3">
                        <DownloadContractButton
                            contract={contract as any}
                            profile={contract.profile}
                        />
                        <p className="text-xs text-gray-400">
                            You can download a copy of the signed agreement for your records.
                        </p>
                    </div>

                    {contract.signed_at && (
                        <p className="text-[10px] text-gray-400 mt-8 uppercase tracking-widest">
                            {new Date(contract.signed_at).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    async function handleSign() {
        if (!signerName.trim()) {
            setError("Please enter your full name.")
            return
        }
        if (!signatureData) {
            setError("Please draw your signature.")
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Compact Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {contract.profile?.logo_url && (
                            <img
                                src={contract.profile.logo_url}
                                alt="Logo"
                                className="h-8 w-8 rounded-lg object-contain"
                            />
                        )}
                        <span className="text-sm font-medium text-gray-700">{providerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FileText className="h-3.5 w-3.5" />
                        Contract
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
                {/* Title Section */}
                <div className="text-center py-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{contract.title}</h1>
                    <p className="text-sm text-gray-500">
                        Please review the agreement below and sign at the bottom.
                    </p>
                </div>

                {/* Contract Body */}
                <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                    {/* Parties */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b">
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Service Provider</p>
                            <p className="text-sm font-medium text-gray-900">{providerName}</p>
                        </div>
                        {contract.client && (
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Client</p>
                                <p className="text-sm font-medium text-gray-900">{contract.client.name}</p>
                                {contract.client.email && (
                                    <p className="text-xs text-gray-500">{contract.client.email}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Terms */}
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {contract.content}
                    </div>
                </div>

                {/* Signing Section */}
                <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b">
                        <PenTool className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Sign This Contract</h2>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full h-11 rounded-lg border border-gray-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="email"
                                value={signerEmail}
                                onChange={(e) => setSignerEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full h-11 rounded-lg border border-gray-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Signature <span className="text-red-500">*</span>
                            </label>
                            <SignatureCanvas onSignatureChange={setSignatureData} />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500 mb-4">
                            By clicking &quot;I Agree &amp; Sign&quot;, you confirm that you have read and agree to the terms of this contract. Your electronic signature is legally binding.
                        </p>
                        <button
                            onClick={handleSign}
                            disabled={loading || !signerName.trim() || !signatureData}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    I Agree &amp; Sign
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-xs text-gray-400">
                        Powered by Aranora • Secure Electronic Signature
                    </p>
                </div>
            </div>
        </div>
    )
}
