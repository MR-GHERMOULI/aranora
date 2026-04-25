"use client"

import { useState, useEffect } from "react";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf/invoice-template";
import { buttonVariants } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Invoice } from "@/types";
import { cn } from "@/lib/utils";
import { logDownload } from "@/app/(dashboard)/invoices/actions";

interface DownloadInvoiceButtonProps {
    invoice: Invoice & { items: any[]; client: any };
    profile: any;
}

export function DownloadInvoiceButton({ invoice, profile }: DownloadInvoiceButtonProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [platformName, setPlatformName] = useState("Aranora");

    useEffect(() => {
        setIsMounted(true);
        
        const fetchBranding = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single();
            if (data?.value?.site_name) {
                setPlatformName(data.value.site_name);
            }
        };
        fetchBranding();
    }, []);

    if (!isMounted) {
        return (
            <button className={cn(buttonVariants({ variant: "outline" }), "opacity-50 cursor-not-allowed")} disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading PDF...
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} profile={profile} paperSize={invoice.paper_size || 'A4'} platformName={platformName} />}
            fileName={`${invoice.invoice_number}.pdf`}
            className={buttonVariants({ variant: "outline" })}
            onClick={() => {
                logDownload(invoice.id);
            }}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
                <>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {loading ? "Generating PDF..." : error ? "Error" : "Download PDF"}
                </>
            )}
        </PDFDownloadLink>
    );
}
