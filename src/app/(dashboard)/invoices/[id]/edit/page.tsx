import { getInvoice } from "../../actions";
import { getClients } from "../../../clients/actions";
import { getProjects } from "../../../projects/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
    const [invoice, clients, projects] = await Promise.all([
        getInvoice(params.id),
        getClients(),
        getProjects()
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Edit Invoice</h1>
                <p className="text-muted-foreground">
                    Update invoice details and line items.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
                    <CardDescription>Make changes to the invoice below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <InvoiceForm
                        clients={clients}
                        projects={projects}
                        invoice={invoice as any}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
