
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  console.log('🍋 Lemon Squeezy Integration Diagnosis')
  console.log('====================================\n')

  // 1. Check profiles columns
  console.log('[1] Checking profiles columns for LS...')
  const { data: profileRow, error: pErr } = await supabase.from('profiles').select('*').limit(1).single()
  if (pErr && pErr.code !== 'PGRST116') {
    console.error('  ❌ Error reading profiles:', pErr.message)
  } else if (profileRow) {
    const keys = Object.keys(profileRow)
    console.log('  Columns:', keys.filter(k => k.includes('lemon') || k.includes('subscription')).join(', '))
    if (keys.includes('lemon_squeezy_customer_id')) {
      console.log('  ✅ lemon_squeezy_customer_id exists')
    } else {
      console.log('  ❌ lemon_squeezy_customer_id MISSING')
    }
  }

  // 2. Check billing_subscriptions table
  console.log('\n[2] Checking billing_subscriptions table...')
  const { data: subRow, error: sErr } = await supabase.from('billing_subscriptions').select('*').limit(1).single()
  if (sErr && sErr.code !== 'PGRST116') {
      if (sErr.code === '42P01') {
          console.log('  ❌ billing_subscriptions table DOES NOT EXIST')
      } else {
          console.error('  ❌ Error reading subscriptions:', sErr.message)
      }
  } else {
    console.log('  ✅ billing_subscriptions table exists')
    if (subRow) {
        const keys = Object.keys(subRow)
        console.log('  Columns:', keys.filter(k => k.includes('lemon') || k.includes('subscription')).join(', '))
        if (keys.includes('lemon_squeezy_subscription_id')) {
            console.log('  ✅ lemon_squeezy_subscription_id exists')
        } else {
            console.log('  ❌ lemon_squeezy_subscription_id MISSING')
        }
    }
  }

  // 3. Check for any existing LS subscriptions
  console.log('\n[3] Checking for existing LS subscriptions...')
  const { count, error: countErr } = await supabase
    .from('billing_subscriptions')
    .select('*', { count: 'exact', head: true })
    .not('lemon_squeezy_subscription_id', 'is', null)
  
  if (countErr) {
    console.log('  Error checking count:', countErr.message)
  } else {
    console.log(`  Found ${count} Lemon Squeezy subscriptions in database.`)
  }

  // 4. Check Webhook Secret
  console.log('\n[4] Environment Check...')
  console.log('  LEMONSQUEEZY_WEBHOOK_SECRET:', process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'SET ✅' : 'MISSING ❌')
  console.log('  LEMONSQUEEZY_API_KEY:', process.env.LEMONSQUEEZY_API_KEY ? 'SET ✅' : 'MISSING ❌')
  console.log('  LEMONSQUEEZY_STORE_ID:', process.env.LEMONSQUEEZY_STORE_ID || 'MISSING ❌')

  console.log('\n====================================')
}

main()
