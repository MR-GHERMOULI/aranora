import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  // 1. Get a user
  const { data: users, error: usersError } = await supabase.auth.admin?.listUsers() || await supabase.from('users').select('id').limit(1);
  
  // Actually, we can just insert a project using the service role key bypassing RLS, 
  // but the RLS or constraints could be the issue. 
  // Let's get a real auth user first.
  let userId = "00000000-0000-0000-0000-000000000000";
  const { data: { users: authUsers } = {} } = await supabase.auth.admin.listUsers();
  if (authUsers && authUsers.length > 0) {
      userId = authUsers[0].id;
  } else {
      console.log("No users found");
  }

  // 2. Get a client
  let clientId = null;
  const { data: client } = await supabase.from('clients').select('id').eq('user_id', userId).limit(1).single();
  if (client) {
      clientId = client.id;
  } else {
      console.log("No client found for user, creating one");
      const { data: newClient } = await supabase.from('clients').insert({ name: 'Test Client', email: 'test@example.com', user_id: userId }).select().single();
      clientId = newClient?.id;
  }

  // 3. Try to insert a project just like the server action
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  const projectData = {
      user_id: userId,
      team_id: teamMember?.team_id || null,
      client_id: clientId,
      title: "Test Project",
      slug: "test-project",
      description: "Desc",
      status: "Planning",
      budget: 1000,
      start_date: null,
      end_date: null,
      hourly_rate: null
    };
    
  console.log("Inserting project with data:", projectData);
  const { data: project, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    console.error("DB Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success:", project);
    // Delete it after
    await supabase.from('projects').delete().eq('id', project.id);
  }
}

testInsert().catch(console.error);
