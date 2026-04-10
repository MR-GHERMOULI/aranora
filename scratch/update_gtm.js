const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateGTM() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const newValue = {
        "google_analytics_id": "G-J2E0KV95VN",
        "google_tag_manager_id": "GTM-PXQSCQLS",
        "google_search_console_code": "<meta name=\"google-site-verification\" content=\"Z_hYaIveSSz6S-FswtCmveCEAg7XOG0EwAEjkSzqH2Y\" />"
    };

    const { error } = await supabase
        .from('platform_settings')
        .update({ value: newValue })
        .eq('key', 'integrations');

    if (error) {
        console.error('Error updating GTM ID:', error);
        process.exit(1);
    } else {
        console.log('Successfully updated GTM ID to GTM-PXQSCQLS');
    }
}

updateGTM();
