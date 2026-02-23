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

async function addMissingProfileColumns() {
    console.log("Checking and adding missing columns to profiles table...");

    const sql = `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'default_paper_size') THEN
        ALTER TABLE profiles ADD COLUMN default_paper_size TEXT DEFAULT 'A4';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'default_tax_rate') THEN
        ALTER TABLE profiles ADD COLUMN default_tax_rate NUMERIC(5,2) DEFAULT 0;
      END IF;
    END $$;
  `;

    // We have to use rpc or query method if defined, or we can just send it via the rest API if there's an exec endpoint,
    // but standard supabase JS client doesn't have a direct `query` method for arbitrary SQL without an RPC wrapper.
    // Instead, since this is a local environment/project we can sometimes use the psql command line tool if available,
    // OR we can create an RPC function first, OR we can just write an sql file and ask the user to run it if necessary.

    // Since we have rights, let's try a workaround if 'exec_sql' exists, or just log the SQL to run manually.
    console.log("SQL to execute:");
    console.log(sql);
}

addMissingProfileColumns();
