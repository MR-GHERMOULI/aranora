
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
if (error) {
    console.error('Error fetching tables:', error);
} else {
    console.log('Tables in public schema:', data.map(t => t.table_name).join(', '));
}
process.exit(0);
