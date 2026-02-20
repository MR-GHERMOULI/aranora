
import { createClient } from './src/lib/supabase/server';

async function diagnose() {
    console.log('--- DB DIAGNOSTICS ---');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log('No user session found.');
        return;
    }
    console.log('Logged in as:', user.id);

    const { data: tasks, count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

    console.log('Total tasks in DB for user:', count);
    if (tasks && tasks.length > 0) {
        console.log('First 3 tasks:');
        tasks.slice(0, 3).forEach(t => console.group(`- ${t.title} (${t.id})`));
    } else {
        console.log('No tasks found.');
    }
}

diagnose();
