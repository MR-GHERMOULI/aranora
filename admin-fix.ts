
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Service Key or URL')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function fix() {
    const email = 'olama@gmail.com'

    // 1. Check if user exists
    console.log('Checking for existing user...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
        console.log('User found:', existingUser.id)
        console.log('Deleting user...')
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            return
        }
        console.log('User deleted successfully.')
    } else {
        console.log('User not found.')
    }

    // 2. Attempt to create user via Admin API
    console.log('Creating user via Admin API...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'TestPass123!',
        email_confirm: true,
        user_metadata: {
            full_name: 'Olama Test User',
            phone: '+213 555 123 456',
            country: 'Algeria'
        }
    })

    if (createError) {
        console.error('Error creating user:', createError)
    } else {
        console.log('User created successfully via Admin API:', newUser.user.id)
        console.log('Please try logging in with this user now.')
    }
}

fix()
