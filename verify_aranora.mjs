
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFlow() {
    console.log('--- ARANORA VERIFICATION START ---');

    // 1. Check Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(2);

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
    }

    if (profiles.length < 1) {
        console.log('No profiles found. Cannot proceed with test.');
        return;
    }

    const userA = profiles[0];
    console.log(`Using User A: ${userA.email} (${userA.id})`);

    // 2. Create a test team for User A
    const teamName = `Test Team ${Date.now()}`;
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ name: teamName, owner_id: userA.id }])
        .select()
        .single();

    if (teamError) {
        console.error('Error creating team:', teamError);
        return;
    }
    console.log(`Created Team: ${team.name} (${team.id})`);

    // Add User A as owner in team_members
    const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ team_id: team.id, user_id: userA.id, role: 'owner' }]);

    if (memberError) {
        console.error('Error adding team member:', memberError);
    } else {
        console.log('User A added as owner.');
    }

    // 3. Create an invitation
    const inviteEmail = 'test_invite@example.com';
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert([{
            team_id: team.id,
            email: inviteEmail,
            role: 'member',
            token: token,
            expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

    if (inviteError) {
        console.error('Error creating invitation:', inviteError);
    } else {
        console.log(`Invitation created for ${inviteEmail} with token: ${token}`);
    }

    // 4. Verify RLS (Conceptual)
    // To truly verify RLS, we'd need to impersonate User B.
    // We can simulate this by checking if the policies exist in SQL (we already did)
    // or by using the anon key and a JWT for a test user B.

    // 5. Verify Task Assignment
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
            user_id: userA.id,
            title: 'Verify RLS Task',
            description: 'Test task assignment',
            status: 'Todo',
            priority: 'High',
            team_id: team.id,
            assigned_to: userA.id
        })
        .select()
        .single();

    if (taskError) {
        console.error('Error creating task:', taskError);
    } else {
        console.log(`Task created and assigned to ${userA.id}: ${task.title}`);
    }

    // Cleanup (Optional but good for testing)
    // ... we'll leave it for now or delete at the end if you want

    console.log('--- ARANORA VERIFICATION END ---');
}

verifyFlow();
