-- ============================================
-- Aranora Lemon Squeezy Integration Schema
-- ============================================

-- 1. Add Lemon Squeezy columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lemon_squeezy_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN lemon_squeezy_customer_id TEXT;
  END IF;
END $$;

-- 2. Update billing_subscriptions to support Lemon Squeezy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_subscriptions' AND column_name = 'lemon_squeezy_subscription_id') THEN
    ALTER TABLE billing_subscriptions ADD COLUMN lemon_squeezy_subscription_id TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_subscriptions' AND column_name = 'lemon_squeezy_customer_id') THEN
    ALTER TABLE billing_subscriptions ADD COLUMN lemon_squeezy_customer_id TEXT;
  END IF;
  -- Make stripe columns optional if they weren't already
  ALTER TABLE billing_subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_billing_subs_ls_id ON billing_subscriptions(lemon_squeezy_subscription_id);
