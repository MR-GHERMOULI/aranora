"use client"

import { useState, useEffect } from "react";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf/invoice-template";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Invoice } from "@/types";

interface DownloadInvoiceButtonProps {
    invoice: Invoice & { items: any[]; client: any };
    profile: any;
}

export function DownloadInvoiceButton({ invoice, profile }: DownloadInvoiceButtonProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Loading PDF...
            </Button>
        );
    }

    return (
        <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} profile={profile} paperSize={invoice.paper_size || 'A4'} />}
            fileName={`${invoice.invoice_number}.pdf`}
        >
            {/* @ts-ignore - render prop type mismatch in library sometimes, safe to ignore for mvp */}
            {({ blob, url, loading, error }) => {
                if (error) {
                    console.error("PDF Generation Error:", error);
                }
                return (
                    <Button
                        variant="outline"
                        disabled={loading || !!error}
                        onClick={() => {
                            if (error) alert("Failed to generate PDF. Please try again.");
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? "Generating PDF..." : error ? "Error Generating PDF" : "Download PDF"}
                    </Button>
                );
            }}
        </PDFDownloadLink>
    );
}
