
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Testing connection to:', process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.from('profiles').select('id').limit(1);
if (error) {
    console.error('Connection failed:', error);
} else {
    console.log('Connection successful, found profile:', data[0]?.id);
}
process.exit(0);
