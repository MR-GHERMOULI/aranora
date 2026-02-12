"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Subscription } from "@/types";

interface SubscriptionNotifierProps {
    renewingSubs: Subscription[];
}

export function SubscriptionNotifier({ renewingSubs }: SubscriptionNotifierProps) {
    const hasNotified = useRef(false);

    useEffect(() => {
        if (renewingSubs.length > 0 && !hasNotified.current) {
            renewingSubs.forEach((sub) => {
                toast.message("Upcoming Renewal", {
                    description: `Your subscription for ${sub.name} is renewing on ${sub.next_renewal_date}`,
                    duration: 10000,
                });
            });
            hasNotified.current = true;
        }
    }, [renewingSubs]);

    return null;
}
