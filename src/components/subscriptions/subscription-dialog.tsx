"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSubscription, updateSubscription } from "@/app/(dashboard)/subscriptions/actions";
import { Subscription } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const subscriptionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.coerce.number().min(0, "Price must be at least 0"),
    currency: z.string().default("USD"),
    billing_cycle: z.enum(["monthly", "yearly"]),
    start_date: z.string().min(1, "Start date is required"),
    status: z.enum(["active", "cancelled", "expired"]).default("active"),
});

interface SubscriptionDialogProps {
    subscription?: Subscription;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function SubscriptionDialog({ subscription, trigger, open, onOpenChange }: SubscriptionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof subscriptionSchema>>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            name: subscription?.name || "",
            price: subscription?.price || 0,
            currency: subscription?.currency || "USD",
            billing_cycle: subscription?.billing_cycle || "monthly",
            start_date: subscription?.start_date || new Date().toISOString().split("T")[0],
            status: subscription?.status || "active",
        },
    });

    const onSubmit = async (data: z.infer<typeof subscriptionSchema>) => {
        try {
            // Calculate next renewal date based on billing cycle
            const startDate = new Date(data.start_date);
            const nextRenewal = new Date(startDate);
            if (data.billing_cycle === 'monthly') {
                nextRenewal.setMonth(nextRenewal.getMonth() + 1);
            } else {
                nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
            }

            const payload = {
                ...data,
                next_renewal_date: nextRenewal.toISOString().split("T")[0],
            };

            if (subscription) {
                await updateSubscription(subscription.id, payload);
                toast.success("Subscription updated");
            } else {
                await createSubscription(payload);
                toast.success("Subscription created");
            }

            setIsOpen(false);
            onOpenChange?.(false);
            router.refresh();
            form.reset();
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleOpenChange = (val: boolean) => {
        setIsOpen(val);
        onOpenChange?.(val);
        if (!val) form.reset();
    }

    return (
        <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{subscription ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" className="col-span-3" {...form.register("name")} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Price
                        </Label>
                        <Input id="price" type="number" step="0.01" className="col-span-3" {...form.register("price")} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="billing_cycle" className="text-right">Cycle</Label>
                        <div className="col-span-3">
                            <Select
                                onValueChange={(val) => form.setValue("billing_cycle", val as "monthly" | "yearly")}
                                defaultValue={form.getValues("billing_cycle")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="start_date" className="text-right">
                            Start Date
                        </Label>
                        <Input id="start_date" type="date" className="col-span-3" {...form.register("start_date")} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
