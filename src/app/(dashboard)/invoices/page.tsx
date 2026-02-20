import { getInvoices } from "./actions";
import { InvoicesClient } from "@/components/invoices/invoices-client";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return <InvoicesClient invoices={invoices} />;
}
