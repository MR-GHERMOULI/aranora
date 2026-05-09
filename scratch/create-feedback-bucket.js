const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function main() {
  console.log('Creating feedback-photos bucket...');
  const { data, error } = await supabase.storage.createBucket('feedback-photos', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('Bucket already exists, making sure it is public...');
        await supabase.storage.updateBucket('feedback-photos', { public: true });
        console.log('Bucket verified.');
    } else {
        console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Successfully created feedback-photos bucket:', data);
  }
}

main();
