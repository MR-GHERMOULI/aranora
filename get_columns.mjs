
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.from('team_members').select('*').limit(1);
if (error) {
    console.error('Error fetching from team_members:', error);
} else {
    console.log('Columns in team_members:', Object.keys(data[0] || {}).join(', '));
}
process.exit(0);
