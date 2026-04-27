const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: 'CREATE TABLE IF NOT EXISTS otp_codes (email TEXT PRIMARY KEY, code TEXT, expires_at TIMESTAMPTZ);'
  });
  if (error) console.error(error);
  else console.log('Table created or already exists');
}

run();
