const fetch = require('node-fetch');

async function testCheckout() {
    try {
        const response = await fetch('http://localhost:3000/api/payments/lemon-squeezy/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We might need a session cookie if auth is enabled, 
                // but let's see if it even reaches the route.
            },
            body: JSON.stringify({
                planType: 'monthly'
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

testCheckout();
