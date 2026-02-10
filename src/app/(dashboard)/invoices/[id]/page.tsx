import { getInvoice } from "../actions";
import { getProfile } from "../../settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, DollarSign, Download, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DownloadInvoiceButton } from "@/components/invoices/download-button";
import { SendInvoiceButton } from "@/components/invoices/send-invoice-button";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const [{ data: invoice, error: invoiceError }, profile] = await Promise.all([
            getInvoice(id),
            getProfile()
        ]);

        if (invoiceError || !invoice) {
            return (
                <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {invoiceError?.code === 'PGRST116' ? 'Invoice Not Found' : 'Error Loading Invoice'}
                    </h1>
                    <p className="text-muted-foreground">
                        {invoiceError?.message || `We couldn't find an invoice with the ID: ${id}`}
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" asChild>
                            <Link href="/invoices">Back to Invoices</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            );
        }

        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const total = typeof invoice.total === 'number' ? invoice.total : 0;
        const subtotal = typeof invoice.subtotal === 'number' ? invoice.subtotal : 0;

        return (
            <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href="/invoices">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{invoice.invoice_number || 'Unnamed Invoice'}</h1>
                                <Badge variant={
                                    invoice.status === 'Paid' ? 'default' :
                                        invoice.status === 'Sent' ? 'secondary' :
                                            invoice.status === 'Overdue' ? 'destructive' : 'outline'
                                }>
                                    {invoice.status || 'Draft'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                Issued on {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : 'No date'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {invoice.client && <DownloadInvoiceButton invoice={invoice as any} profile={profile} />}
                        <Button variant="outline" asChild>
                            <Link href={`/invoices/${invoice.id}/edit`}>Edit Invoice</Link>
                        </Button>
                        {invoice.client && <SendInvoiceButton invoice={invoice as any} profile={profile} />}
                        <DeleteInvoiceDialog invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Sidebar Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {invoice.client && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                                            <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Bill To</p>
                                            <Link href={`/clients/${invoice.client_id}`} className="text-sm text-brand-primary hover:underline">
                                                {invoice.client.name}
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Due Date</p>
                                        <div className="text-sm text-muted-foreground">
                                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'No due date'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm text-muted-foreground">Subtotal</p>
                                        <p className="text-sm font-medium">${subtotal.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-base font-bold text-brand-primary">Total</p>
                                        <p className="text-xl font-bold text-brand-primary">${total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Line Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No items listed for this invoice.
                                    </div>
                                ) : (
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Qty</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Unit Price</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {items.map((item: any, i: number) => (
                                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                        <td className="p-4 align-middle">{item.description}</td>
                                                        <td className="p-4 align-middle text-right">{item.quantity}</td>
                                                        <td className="p-4 align-middle text-right">${item.unit_price}</td>
                                                        <td className="p-4 align-middle text-right font-medium">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Critical error in InvoicePage:", error);
        return (
            <div className="p-12 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-2xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground">We encountered an error while loading this invoice. Please try again later.</p>
                <Button asChild className="mt-4">
                    <Link href="/invoices">Back to Invoices</Link>
                </Button>
            </div>
        );
    }
}
