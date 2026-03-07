"use client"

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/pdf/contract-pdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { Contract } from "@/types";

interface DownloadContractButtonProps {
    contract: Contract & { client?: any };
    profile?: any;
}

export function DownloadContractButton({ contract, profile }: DownloadContractButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const pdfDoc = <ContractPDF contract={contract} profile={profile} />;
            const asPdf = pdf(pdfDoc);
            const blob = await asPdf.toBlob();

            const safeFileName = contract.title ? contract.title.replace(/[^a-zA-Z0-9-]/g, '-') : 'contract';
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeFileName}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            disabled={isGenerating}
            onClick={handleDownload}
            className="h-9 px-4 border-slate-200 hover:bg-slate-50 gap-2 font-semibold transition-all"
        >
            {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
                <FileDown className="h-4 w-4 text-slate-400" />
            )}
            {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
    );
}
