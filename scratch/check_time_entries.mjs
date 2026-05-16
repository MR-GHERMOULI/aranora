import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTimeEntries() {
    console.log("Checking time_entries table...");
    const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching from time_entries:", error);
    } else {
        console.log("Successfully fetched from time_entries.");
        console.log("Sample entry:", data[0]);
    }

    console.log("\nChecking columns in time_entries...");
    const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'time_entries' });

    if (colError) {
        // If RPC doesn't exist, try direct query to information_schema
        const { data: cols, error: infoError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'time_entries');
        
        if (infoError) {
            console.error("Error fetching columns:", infoError);
        } else {
            console.log("Columns:", cols.map(c => c.column_name).join(', '));
        }
    } else {
        console.log("Columns:", columns);
    }
}

checkTimeEntries();
