import { getClients } from "./actions";
import { ClientsClient } from "@/components/clients/clients-client";

export default async function ClientsPage() {
    const clients = await getClients();

    return <ClientsClient clients={clients} />;
}
