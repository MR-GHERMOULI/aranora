
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.LEMONSQUEEZY_API_KEY;

async function fetchVariants() {
    const response = await fetch('https://api.lemonsqueezy.com/v1/products/1049702/variants', {
        headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${apiKey}`
        }
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

fetchVariants();
