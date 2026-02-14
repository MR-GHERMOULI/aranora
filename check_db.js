const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking projects table columns...');

    // Attempt to select one row and see if 'slug' is returned
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching project:', error.message);
        process.exit(1);
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Columns found:', columns.join(', '));
        if (columns.includes('slug')) {
            console.log(' SUCCESS: "slug" column exists.');
        } else {
            console.log(' FAILURE: "slug" column is MISSING.');
        }
    } else {
        console.log('No projects found to check columns. Attempting to insert a temporary project to verify schema...');

        // Try a dry run or check via rpc if possible, but let's try to just select from information_schema
        const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'projects' });

        if (colError) {
            console.log('RPC check failed (likely no such function). Trying direct SQL query...');
            // We can't run arbitrary SQL via the client unless we have an RPC set up.
            // Let's try to insert a dummy project with a slug.
            const { error: insertError } = await supabase
                .from('projects')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000', // Dummy
                    title: 'Schema Check',
                    slug: 'schema-check',
                    status: 'Planning'
                })
                .select();

            if (insertError) {
                if (insertError.message.includes('column "slug" of relation "projects" does not exist')) {
                    console.log(' FAILURE: "slug" column is definitely MISSING.');
                } else {
                    console.error('Insert error:', insertError.message);
                }
            } else {
                console.log(' SUCCESS: "slug" column exists (insert worked).');
                // Clean up
                await supabase.from('projects').delete().eq('title', 'Schema Check');
            }
        } else {
            console.log('Columns via RPC:', cols);
        }
    }
}

checkSchema();
