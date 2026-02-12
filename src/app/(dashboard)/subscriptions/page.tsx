
import { getSubscriptions } from "./actions";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SubscriptionDialog } from "@/components/subscriptions/subscription-dialog";

export default async function SubscriptionsPage() {
    const subscriptions = await getSubscriptions();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
                <div className="flex items-center space-x-2">
                    <SubscriptionDialog
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Subscription
                            </Button>
                        }
                    />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {subscriptions.map((sub) => (
                    <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
                {subscriptions.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No subscriptions found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
