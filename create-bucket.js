const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function main() {
  console.log('Creating articles bucket...');
  const { data, error } = await supabase.storage.createBucket('articles', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('Bucket already exists, making sure it is public...');
        await supabase.storage.updateBucket('articles', { public: true });
        console.log('Bucket verified.');
    } else {
        console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Successfully created articles bucket:', data);
  }
}

main();
