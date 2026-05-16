import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
    console.log("Checking time_entries table join...");
    const { data, error } = await supabase
        .from("time_entries")
        .select(`
            *,
            project:projects(title, user_id),
            task:tasks(title)
        `)
        .limit(1);

    if (error) {
        console.error("Time Entries error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Time Entries OK:", data);
    }
}

checkTables();
