'use server';

import { createClient } from '@/lib/supabase/server';
import { setupLemonSqueezy } from '@/lib/lemonsqueezy';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';

export async function getLemonSqueezyManagementUrl() {
    try {
        setupLemonSqueezy();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Get the most recent active subscription for this user
        const { data: subscription } = await supabase
            .from('billing_subscriptions')
            .select('lemon_squeezy_subscription_id')
            .eq('user_id', user.id)
            .not('lemon_squeezy_subscription_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!subscription?.lemon_squeezy_subscription_id) return null;

        const { data: lsSub, error } = await getSubscription(subscription.lemon_squeezy_subscription_id);
        
        if (error || !lsSub) {
            console.error('Error fetching LS subscription:', error);
            return null;
        }

        return lsSub.data.attributes.urls.customer_portal;
    } catch (error) {
        console.error('getLemonSqueezyManagementUrl error:', error);
        return null;
    }
}
