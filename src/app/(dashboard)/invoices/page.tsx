import { getInvoices } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, User, Calendar, DollarSign, History } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Invoices</h2>
                    <p className="text-muted-foreground">
                        Manage your billing and track payments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/invoices/history">
                            <History className="mr-2 h-4 w-4" /> History
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/invoices/new">
                            <Plus className="mr-2 h-4 w-4" /> Create Invoice
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invoices.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No invoices found. Create your first invoice to get started.
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-md transition-shadow dark:bg-card dark:border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {invoice.invoice_number}
                                </CardTitle>
                                <Badge variant={
                                    invoice.status === 'Paid' ? 'default' :
                                        invoice.status === 'Sent' ? 'secondary' :
                                            invoice.status === 'Overdue' ? 'destructive' : 'outline'
                                }>
                                    {invoice.status}
                                </Badge>
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
                                    ${(invoice.total || 0).toLocaleString()}
                                </div>
                                {invoice.due_date && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-end border-t pt-4 mt-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/invoices/${invoice.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
