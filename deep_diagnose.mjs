import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kefiwzcqfchybghhqbpq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZml3emNxZmNoeWJnaGhxYnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1MzM1NiwiZXhwIjoyMDg0OTI5MzU2fQ.gcCGkYrktyQGnWrFHJzj7ePuoREKfbb6yTZf1rgYYOs'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔍 Deep Database Diagnosis')
  console.log('==========================\n')

  // 1. Check ALL columns in profiles table
  console.log('[1] All columns in profiles table:')
  const { data: cols, error: colsErr } = await supabase.rpc('get_profiles_columns')
  
  // Fallback: query information_schema via a raw approach
  // We'll try to insert a minimal profile to see what error we get
  console.log('\n[2] Testing minimal profile insert...')
  const testId = '00000000-0000-0000-0000-000000000001'
  
  // First clean up any previous test
  await supabase.from('profiles').delete().eq('id', testId)
  
  const { error: minInsertErr } = await supabase.from('profiles').insert({
    id: testId,
    username: 'diag_test_' + Date.now(),
    full_name: 'Test',
    email: 'diag@test.com',
    company_email: 'diag@test.com',
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_status: 'trialing'
  })
  
  if (minInsertErr) {
    console.log(`  ❌ Insert failed: ${minInsertErr.message}`)
    console.log(`     Details: ${JSON.stringify(minInsertErr)}`)
  } else {
    console.log('  ✅ Manual insert succeeded')
    // Clean up
    await supabase.from('profiles').delete().eq('id', testId)
    console.log('  ✅ Cleaned up test row')
  }

  // 3. Check existing triggers on auth.users
  console.log('\n[3] Checking triggers on auth.users...')
  const { data: triggers, error: trigErr } = await supabase.rpc('list_auth_triggers')
  if (triggers) {
    console.log('  Triggers:', JSON.stringify(triggers, null, 2))
  } else {
    console.log('  Could not query triggers via RPC')
  }

  // 4. Check if there are OTHER triggers on auth.users that might be failing
  console.log('\n[4] Trying to get trigger info via SQL...')
  
  // 5. Check all constraints on profiles
  console.log('\n[5] Checking profiles table constraints...')
  const { data: existing, error: existErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (existErr) {
    console.log(`  ❌ Cannot read profiles: ${existErr.message}`)
  } else if (existing && existing.length > 0) {
    console.log('  Columns found:', Object.keys(existing[0]).join(', '))
  } else {
    console.log('  Table is empty but accessible')
    // Try to get column list by selecting with wrong filter
    const { data: emptyRow, error: emptyErr } = await supabase
      .from('profiles')
      .select('*')
      .limit(0)
    console.log('  Schema probe result:', emptyErr?.message || 'OK')
  }

  // 6. Check if there's a NOT NULL constraint on columns that the trigger might miss
  console.log('\n[6] Testing what columns are required (NOT NULL)...')
  
  const testId2 = '00000000-0000-0000-0000-000000000002'
  await supabase.from('profiles').delete().eq('id', testId2)
  
  // Try with absolute minimum
  const { error: bareErr } = await supabase.from('profiles').insert({
    id: testId2,
    username: 'bare_test_' + Date.now(),
  })
  
  if (bareErr) {
    console.log(`  Minimal insert (id+username only) failed: ${bareErr.message}`)
  } else {
    console.log('  ✅ Minimal insert (id+username only) succeeded — other cols are nullable')
    await supabase.from('profiles').delete().eq('id', testId2)
  }

  // 7. Check if the notify_admin_new_user trigger could be causing the issue
  console.log('\n[7] Checking admin_notifications table...')
  const { data: notifCheck, error: notifErr } = await supabase
    .from('admin_notifications')
    .select('id')
    .limit(1)
  
  if (notifErr) {
    console.log(`  ❌ admin_notifications table issue: ${notifErr.message}`)
    console.log('  🔴 This could be the cause! The notify_admin_new_user trigger')
    console.log('     fires on auth.users INSERT and if admin_notifications table')
    console.log('     does not exist or has wrong schema, it blocks user creation!')
  } else {
    console.log('  ✅ admin_notifications table exists and is accessible')
  }

  // 8. Try to check if there are any OTHER triggers
  console.log('\n[8] Checking for any RLS policies that might block inserts...')
  
  // Test: can the service role insert into profiles with ON CONFLICT?
  const testId3 = '00000000-0000-0000-0000-000000000003'
  await supabase.from('profiles').delete().eq('id', testId3)
  
  const { error: conflictErr } = await supabase.from('profiles').upsert({
    id: testId3,
    username: 'conflict_test_' + Date.now(),
    full_name: 'Test',
    email: 'conflict@test.com',
    company_email: 'conflict@test.com',
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_status: 'trialing'
  })
  
  if (conflictErr) {
    console.log(`  ❌ Upsert failed: ${conflictErr.message}`)
  } else {
    console.log('  ✅ Upsert succeeded')
    await supabase.from('profiles').delete().eq('id', testId3)
  }

  // 9. Check the EXACT error by trying to create user with detailed error capture
  console.log('\n[9] Attempting user creation with full error capture...')
  const testEmail = `deeptest_${Date.now()}@aranora-internal.test`
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123!Secure',
        email_confirm: true,
        user_metadata: {
          full_name: 'Deep Test',
          phone: '+213600000000',
          country: 'Algeria'
        }
      })
    })
    
    const body = await response.text()
    console.log(`  Status: ${response.status}`)
    console.log(`  Response: ${body}`)
    
    if (response.ok) {
      const userData = JSON.parse(body)
      console.log('  ✅ User created successfully!')
      
      // Check if profile was created
      await new Promise(r => setTimeout(r, 2000))
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single()
      
      if (prof) {
        console.log('  ✅ Profile created by trigger!')
        console.log('  Profile:', JSON.stringify(prof, null, 2))
      } else {
        console.log('  ❌ Profile NOT created by trigger:', profErr?.message)
      }
      
      // Cleanup
      await supabase.auth.admin.deleteUser(userData.id)
      console.log('  ✅ Test user cleaned up')
    }
  } catch (fetchErr) {
    console.log(`  ❌ Fetch error: ${fetchErr.message}`)
  }

  // 10. Check if there's a unique constraint issue on username
  console.log('\n[10] Checking for duplicate username issues...')
  const { data: dupeCheck, error: dupeErr } = await supabase
    .from('profiles')
    .select('username')
    .limit(100)
  
  if (dupeCheck) {
    const usernames = dupeCheck.map(p => p.username)
    const dupes = usernames.filter((item, index) => usernames.indexOf(item) !== index)
    if (dupes.length > 0) {
      console.log(`  ⚠️  Duplicate usernames found: ${dupes.join(', ')}`)
    } else {
      console.log(`  ✅ No duplicate usernames (checked ${usernames.length} rows)`)
    }
  }

  console.log('\n==========================')
  console.log('🔍 Deep diagnosis complete')
}

main().catch(err => {
  console.error('Script error:', err)
})
