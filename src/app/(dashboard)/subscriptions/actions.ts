"use server";

import { createClient } from "@/lib/supabase/server";
import { Subscription } from "@/types";
import { revalidatePath } from "next/cache";

export async function getSubscriptions() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq('user_id', user.id)
        .order("next_renewal_date", { ascending: true });

    if (error) {
        console.error("Error fetching subscriptions:", error);
        throw new Error("Failed to fetch subscriptions");
    }

    return data as Subscription[];
}

export async function createSubscription(data: Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase.from("subscriptions").insert({
        ...data,
        user_id: user.id,
    });

    if (error) {
        console.error("Error creating subscription:", error);
        throw new Error("Failed to create subscription");
    }

    revalidatePath("/subscriptions");
}

export async function updateSubscription(id: string, data: Partial<Subscription>) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("subscriptions")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating subscription:", error);
        throw new Error("Failed to update subscription");
    }

    revalidatePath("/subscriptions");
}

export async function deleteSubscription(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error deleting subscription:", error);
        throw new Error("Failed to delete subscription");
    }

    revalidatePath("/subscriptions");
}

export async function getUpcomingRenewals() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_renewal_date", threeDaysLater.toISOString().split("T")[0])
        .gte("next_renewal_date", today.toISOString().split("T")[0])
        .eq("status", "active");

    if (error) {
        console.error("Error fetching upcoming renewals:", error);
        return [];
    }

    return data as Subscription[];
}
