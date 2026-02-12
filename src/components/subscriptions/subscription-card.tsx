"use client";

import { Subscription } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionDialog } from "./subscription-dialog";
import { deleteSubscription } from "@/app/(dashboard)/subscriptions/actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SubscriptionCardProps {
    subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteSubscription(subscription.id);
            toast.success("Subscription deleted");
            setShowDeleteDialog(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete subscription");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
            case "cancelled":
                return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            case "expired":
                return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
            default:
                return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
        }
    };

    const daysUntilRenewal = () => {
        const today = new Date();
        const renewal = new Date(subscription.next_renewal_date);
        const diffTime = renewal.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Overdue";
        if (diffDays === 0) return "Renewing today";
        return `${diffDays} days left`;
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {subscription.name}
                    </CardTitle>
                    <Badge className={getStatusColor(subscription.status)} variant="outline">
                        {subscription.status}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {subscription.currency === "USD" ? "$" : subscription.currency}
                        {subscription.price}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                            / {subscription.billing_cycle}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Next renewal: {format(new Date(subscription.next_renewal_date), "MMM d, yyyy")}
                    </p>
                    <p className={`text-xs mt-1 ${daysUntilRenewal() === "Overdue" ? "text-red-500" : "text-muted-foreground"}`}>
                        {daysUntilRenewal()}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <SubscriptionDialog
                        subscription={subscription}
                        trigger={
                            <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                        }
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your subscription.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
