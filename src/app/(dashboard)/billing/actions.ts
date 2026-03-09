'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserBillingInfo, type UserBillingInfo } from '@/lib/billing';

export async function getBillingInfo(): Promise<UserBillingInfo | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return getUserBillingInfo(user.id);
}

export async function getBillingHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return data || [];
}
