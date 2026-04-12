import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kefiwzcqfchybghhqbpq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZml3emNxZmNoeWJnaGhxYnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1MzM1NiwiZXhwIjoyMDg0OTI5MzU2fQ.gcCGkYrktyQGnWrFHJzj7ePuoREKfbb6yTZf1rgYYOs'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔧 Aranora Registration Fix Script')
  console.log('====================================')

  // ── STEP 1: Verify profiles table columns ──────────────────────────────
  console.log('\n[1/6] Checking profiles table columns...')
  const { data: colCheck, error: colErr } = await supabase
    .from('profiles')
    .select('id, email, trial_ends_at, subscription_status')
    .limit(1)

  if (colErr) {
    console.log(`  ❌ profiles query failed: ${colErr.message}`)
    console.log('     → Some columns may be missing. The SQL fix is needed.')
  } else {
    console.log('  ✅ Columns email, trial_ends_at, subscription_status all exist.')
  }

  // ── STEP 2: Test trigger by creating a test user ───────────────────────
  console.log('\n[2/6] Creating test user to check handle_new_user() trigger...')
  const testEmail = `triggertest_${Date.now()}@aranora-internal.test`

  const { data: testUserData, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPass123!Secure',
    email_confirm: true,
    user_metadata: {
      full_name: 'Trigger Test',
      phone: '+213600000000',
      country: 'Algeria'
    }
  })

  if (createErr) {
    console.log(`  ❌ Admin createUser failed: ${createErr.message}`)
    console.log('     → Cannot test trigger. Check service role permissions.')
    process.exit(1)
  }

  const testUserId = testUserData.user.id
  console.log(`  ✅ User created: ${testUserId}`)

  // Wait for trigger to fire
  await new Promise(r => setTimeout(r, 3000))

  // ── STEP 3: Check if trigger created the profile ───────────────────────
  console.log('\n[3/6] Checking if trigger created profile row...')
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, email, trial_ends_at, subscription_status')
    .eq('id', testUserId)
    .single()

  let triggerWorks = false

  if (profErr || !profile) {
    console.log(`  ❌ TRIGGER FAILED — no profile was created!`)
    console.log(`     Supabase error: ${profErr?.message || 'profile not found'}`)
    console.log('\n  🔴 ROOT CAUSE: handle_new_user() trigger is broken.')
    console.log('     This is why users see "Registration failed." error.')
  } else {
    triggerWorks = true
    console.log(`  ✅ TRIGGER WORKS! Profile created:`)
    console.log(`     id:                  ${profile.id}`)
    console.log(`     username:            ${profile.username}`)
    console.log(`     email:               ${profile.email}`)
    console.log(`     subscription_status: ${profile.subscription_status}`)
    console.log(`     trial_ends_at:       ${profile.trial_ends_at}`)
  }

  // ── STEP 4: Manual profile insert (if trigger failed) ─────────────────
  if (!triggerWorks) {
    console.log('\n[4/6] Testing manual profile insert (checks table structure)...')
    const suffix = Math.random().toString(36).substring(2,6)
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: testUserId,
      username: `triggertest_${suffix}`,
      full_name: 'Trigger Test',
      email: testEmail,
      company_email: testEmail,
      phone: '+213600000000',
      country: 'Algeria',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_status: 'trialing'
    })
    if (insertErr) {
      console.log(`  ❌ Manual insert ALSO failed: ${insertErr.message}`)
      console.log('     → Likely a missing column or CHECK constraint issue.')
      console.log('     → Run the FULL fix_registration.sql in Supabase SQL Editor!')
    } else {
      console.log('  ✅ Manual insert SUCCEEDED — table structure is correct.')
      console.log('     → Trigger function body is the problem, not the schema.')
      console.log('     → Run fix_registration.sql to replace handle_new_user().')
    }
  } else {
    console.log('\n[4/6] Skipped (trigger works).')
  }

  // ── STEP 5: Cleanup test user ──────────────────────────────────────────
  console.log('\n[5/6] Cleaning up test user...')
  const { error: delErr } = await supabase.auth.admin.deleteUser(testUserId)
  if (delErr) {
    console.log(`  ⚠️  Could not delete test user (non-critical): ${delErr.message}`)
  } else {
    console.log('  ✅ Test user deleted.')
  }

  // ── STEP 6: Fix all existing users without profile rows ───────────────
  console.log('\n[6/6] Scanning for real users missing profile rows...')
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listErr) {
    console.log(`  ❌ Cannot list users: ${listErr.message}`)
  } else {
    const realUsers = listData.users.filter(u =>
      u.email &&
      !u.email.includes('aranora-internal.test') &&
      !u.email.includes('aranora-test.internal')
    )
    console.log(`  Found ${realUsers.length} real users in auth.users.`)
    let fixed = 0
    let alreadyOk = 0

    for (const u of realUsers) {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', u.id)
        .single()

      if (!existingProf) {
        const base = (u.email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'
        const sfx = Math.random().toString(36).substring(2, 6)
        const { error: fixErr } = await supabase.from('profiles').insert({
          id: u.id,
          username: `${base}_${sfx}`,
          full_name: u.user_metadata?.full_name || '',
          email: u.email,
          company_email: u.email,
          phone: u.user_metadata?.phone || null,
          country: u.user_metadata?.country || null,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trialing'
        })
        if (fixErr) {
          console.log(`  ❌  ${u.email}: ${fixErr.message}`)
        } else {
          console.log(`  ✅  Created missing profile for: ${u.email}`)
          fixed++
        }
      } else {
        alreadyOk++
      }
    }

    console.log(`\n  Summary: ${alreadyOk} users already had profiles. ${fixed} profiles created.`)
  }

  // ── FINAL REPORT ───────────────────────────────────────────────────────
  console.log('\n====================================')
  console.log('📋 DIAGNOSIS COMPLETE')
  console.log('====================================')
  if (!triggerWorks) {
    console.log('\n🔴 ACTION REQUIRED:')
    console.log('   The handle_new_user() database trigger is BROKEN.')
    console.log('   You MUST run fix_registration.sql in Supabase SQL Editor.')
    console.log('   File path: c:\\Users\\ACER\\Desktop\\aranora\\fix_registration.sql')
    console.log('\n   Steps:')
    console.log('   1. Open: https://supabase.com/dashboard/project/kefiwzcqfchybghhqbpq/sql/new')
    console.log('   2. Paste the full content of fix_registration.sql')
    console.log('   3. Click Run button')
    console.log('   4. Then re-deploy to Vercel (the updated actions.ts code is already saved)')
  } else {
    console.log('\n✅ TRIGGER IS WORKING.')
    console.log('   The fix in actions.ts (belt-and-suspenders ensureProfile) covers edge cases.')
    console.log('   Deploy the updated code to Vercel to complete the fix.')
  }
}

main().catch(console.error)
