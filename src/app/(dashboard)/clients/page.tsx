import { getClients } from "./actions";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Clients</h2>
                    <p className="text-muted-foreground">
                        Manage your client relationships and contact details.
                    </p>
                </div>
                <AddClientDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No clients found. Add your first client to get started.
                    </div>
                ) : (
                    clients.map((client) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {client.name}
                                </CardTitle>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${client.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        client.status === 'Potential' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                    {client.status}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 mt-2">
                                {client.email && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Mail className="mr-2 h-4 w-4" />
                                        {client.email}
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Phone className="mr-2 h-4 w-4" />
                                        {client.phone}
                                    </div>
                                )}
                                {!client.email && !client.phone && (
                                    <div className="text-sm text-muted-foreground italic">
                                        No contact info
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/clients/${client.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
