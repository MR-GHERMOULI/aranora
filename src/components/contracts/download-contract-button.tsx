"use client"

import { PDFDownloadLink } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/pdf/contract-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
                <Button variant="outline" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? "Generating..." : "Download PDF"}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
