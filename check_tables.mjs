
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tablesToCheck = ['profiles', 'projects', 'tasks', 'invoices', 'project_collaborators', 'teams', 'team_members', 'team_invitations'];

for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
        console.log(`Table [${table}]: Error - ${error.message}`);
    } else {
        console.log(`Table [${table}]: Exists`);
    }
}
process.exit(0);
