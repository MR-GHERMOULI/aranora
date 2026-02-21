"use client"

import { PDFDownloadLink } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/pdf/contract-pdf";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Contract } from "@/types";

interface DownloadContractButtonProps {
    contract: Contract & { client?: any };
    profile?: any;
}

export function DownloadContractButton({ contract, profile }: DownloadContractButtonProps) {
    return (
        <PDFDownloadLink
            document={<ContractPDF contract={contract} profile={profile} />}
            fileName={`${contract.title.replace(/\s+/g, '-')}.pdf`}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
                <Button
                    variant="outline"
                    disabled={loading}
                    className="h-9 px-4 border-slate-200 hover:bg-slate-50 gap-2 font-semibold transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <FileDown className="h-4 w-4 text-slate-400" />
                    )}
                    {loading ? "Generating..." : "Download PDF"}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
