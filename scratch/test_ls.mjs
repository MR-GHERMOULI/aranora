
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.LEMONSQUEEZY_API_KEY;
const storeId = process.env.LEMONSQUEEZY_STORE_ID;
const variantId = process.env.LEMONSQUEEZY_VARIANT_MONTHLY_ID;

console.log('Testing Lemon Squeezy Checkout Creation...');
console.log('Store ID:', storeId);
console.log('Variant ID:', variantId);

if (!apiKey || !storeId || !variantId) {
    console.error('Missing environment variables. Check .env.local');
    process.exit(1);
}

lemonSqueezySetup({
    apiKey: apiKey,
});

async function test() {
    try {
        const { data, error } = await createCheckout(storeId, variantId, {
            checkoutData: {
                email: 'test@example.com',
                custom: {
                    user_id: 'test-user-id',
                    plan_type: 'monthly',
                },
            },
        });

        if (error) {
            console.error('Error creating checkout:', JSON.stringify(error, null, 2));
        } else {
            console.log('Checkout created successfully!');
            console.log('URL:', data.data.attributes.url);
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

test();
