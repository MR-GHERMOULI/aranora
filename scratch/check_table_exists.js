const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Manually load .env.local
const env = dotenv.parse(fs.readFileSync('.env.local'));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from('otp_codes').select('*');
  if (error) console.error('Error fetching otp_codes:', error.message);
  else console.log('Successfully fetched otp_codes');
}

run();
