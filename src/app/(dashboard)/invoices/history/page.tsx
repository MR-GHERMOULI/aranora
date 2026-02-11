import { getDownloadHistory } from "../actions";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export default async function DownloadHistoryPage() {
    const history = await getDownloadHistory();

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/invoices">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Download History</h2>
                    </div>
                    <p className="text-muted-foreground mt-2 ml-12">
                        Track and re-download previously accessed invoices.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Downloads</CardTitle>
                    <CardDescription>A log of all invoices you have downloaded.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No download history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{format(new Date(log.downloaded_at), 'MMM d, yyyy h:mm a')}</TableCell>
                                        <TableCell>{log.invoice?.invoice_number}</TableCell>
                                        <TableCell>{log.invoice?.client?.name}</TableCell>
                                        <TableCell className="text-right">${(log.invoice?.total || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/invoices/${log.invoice?.invoice_number || log.invoice_id}`}>
                                                    View Invoice
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
