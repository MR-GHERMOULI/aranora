"use client"

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Invoice } from "@/types";

interface SendInvoiceButtonProps {
    invoice: Invoice & { client: any };
    profile: any;
}

export function SendInvoiceButton({ invoice, profile }: SendInvoiceButtonProps) {
    const handleSend = () => {
        const clientEmail = invoice.client?.email || "";
        const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} from ${profile?.company_name || profile?.full_name || 'Aranora'}`);

        const body = encodeURIComponent(
            `Hello ${invoice.client?.name || 'Client'},\n\n` +
            `Please find the details for invoice ${invoice.invoice_number} below:\n\n` +
            `Invoice Number: ${invoice.invoice_number}\n` +
            `Total Amount: $${(invoice.total || 0).toLocaleString()}\n` +
            `Due Date: ${invoice.due_date || 'On Receipt'}\n\n` +
            `Please download the attached PDF for full details.\n\n` +
            `Thank you,\n` +
            `${profile?.company_name || profile?.full_name || 'Aranora'}`
        );

        window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
    };

    return (
        <Button variant="default" onClick={handleSend}>
            <Send className="mr-2 h-4 w-4" /> Send Invoice
        </Button>
    );
}
