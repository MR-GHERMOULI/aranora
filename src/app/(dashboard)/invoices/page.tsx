import { getInvoices } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, User, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Invoices</h2>
                    <p className="text-muted-foreground">
                        Manage your billing and track payments.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/invoices/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invoices.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No invoices found. Create your first invoice to get started.
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {invoice.invoice_number}
                                </CardTitle>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                        invoice.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'}`}>
                                    {invoice.status}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 mt-2">
                                {invoice.client && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        {invoice.client.name}
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    ${invoice.total.toLocaleString()}
                                </div>
                                {invoice.due_date && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/dashboard/invoices/${invoice.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
