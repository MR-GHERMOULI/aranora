const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'branding')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }

  console.log('Favicon URL:', data?.value?.favicon_url);

  if (data?.value?.favicon_url) {
    const response = await fetch(data.value.favicon_url);
    console.log('Fetch status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    const arrayBuffer = await response.arrayBuffer();
    console.log('ArrayBuffer byteLength:', arrayBuffer.byteLength);
  }
}

test();
