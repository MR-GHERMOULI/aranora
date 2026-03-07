"use client"

import { useState, useEffect } from "react";
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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button
                variant="outline"
                disabled
                className="h-9 px-4 border-slate-200 gap-2 font-semibold"
            >
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                Loading PDF...
            </Button>
        );
    }

    const safeFileName = contract.title ? contract.title.replace(/[^a-zA-Z0-9-]/g, '-') : 'contract';

    return (
        <PDFDownloadLink
            document={<ContractPDF contract={contract} profile={profile} />}
            fileName={`${safeFileName}.pdf`}
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
