import { getInvoice } from "../actions";
import { getProfile } from "../../settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, DollarSign, Download, Send } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { DownloadInvoiceButton } from "@/components/invoices/download-button";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";

export default async function InvoicePage({ params }: { params: { id: string } }) {
    const [invoice, profile] = await Promise.all([
        getInvoice(params.id),
        getProfile()
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="px-4 lg:px-8 space-y-6 pt-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/invoices">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-primary">{invoice.invoice_number}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                  ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                invoice.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                    invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'}`}>
                            {invoice.status}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1">Issued on {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex gap-2">
                    {invoice.client && <DownloadInvoiceButton invoice={invoice as any} profile={profile} />}
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Edit Invoice</Link>
                    </Button>
                    <Button variant="default">
                        <Send className="mr-2 h-4 w-4" /> Send Invoice
                    </Button>
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
                                    <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center">
                                        <User className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Bill To</p>
                                        <Link href={`/dashboard/clients/${invoice.client_id}`} className="text-sm text-brand-primary hover:underline">
                                            {invoice.client.name}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-orange-600" />
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
                                    <p className="text-sm font-medium">${invoice.subtotal.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-base font-bold text-brand-primary">Total</p>
                                    <p className="text-xl font-bold text-brand-primary">${invoice.total.toLocaleString()}</p>
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
                                        {invoice.items.map((item: any, i: number) => (
                                            <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">{item.description}</td>
                                                <td className="p-4 align-middle text-right">{item.quantity}</td>
                                                <td className="p-4 align-middle text-right">${item.unit_price}</td>
                                                <td className="p-4 align-middle text-right font-medium">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
