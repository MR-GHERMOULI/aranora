import { getSubscriptions } from "./actions";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";

export default async function SubscriptionsPage() {
    const subscriptions = await getSubscriptions();

    return <SubscriptionsClient subscriptions={subscriptions} />;
}
