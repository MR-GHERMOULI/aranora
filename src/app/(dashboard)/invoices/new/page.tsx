import { getClients } from "../../clients/actions";
import { getProjects } from "../../projects/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "../../settings/actions";

export default async function NewInvoicePage() {
    const [clients, projects, profile] = await Promise.all([
        getClients(),
        getProjects(),
        getProfile()
    ]);

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Create New Invoice</h1>
                <p className="text-muted-foreground">
                    Fill in the details below to generate a new invoice.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Enter client information and add line items.</CardDescription>
                </CardHeader>
                <CardContent>
                    <InvoiceForm clients={clients} projects={projects} profile={profile} />
                </CardContent>
            </Card>
        </div>
    );
}
