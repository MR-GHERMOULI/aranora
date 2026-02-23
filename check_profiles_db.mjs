import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  const { data, error } = await supabase.rpc('get_table_columns_by_name', { table_name_input: 'profiles' });
  
  if (error) {
     console.log('RPC failed, trying generic select');
     const { data: cols, error: err2 } = await supabase.from('profiles').select('*').limit(1);
     if (err2) {
         console.error('Error fetching profiles:', err2);
         return;
     }
     if (cols && cols.length > 0) {
         console.log('Columns in profiles (from data):', Object.keys(cols[0]).join(', '));
     } else {
         console.log('No data in profiles table, cannot infer columns this way.');
     }
  } else {
    console.log('Columns from RPC:', data?.map((col) => col.column_name).join(', '));
  }
}

checkProfilesTable();
