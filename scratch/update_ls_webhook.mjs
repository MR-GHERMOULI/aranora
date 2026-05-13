
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.LEMONSQUEEZY_API_KEY;

async function updateWebhook() {
    const webhookId = '99548'; // Found in previous fetch
    const response = await fetch(`https://api.lemonsqueezy.com/v1/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            data: {
                type: 'webhooks',
                id: webhookId,
                attributes: {
                    url: 'https://aranora.com/api/payments/lemon-squeezy/webhook'
                }
            }
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

updateWebhook();
