-- ============================================
-- Aranora Billing & Subscription Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add billing columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- 2. Billing Subscriptions Table (Stripe-managed subscriptions)
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  promo_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_subs_user_id ON billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_stripe_id ON billing_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON billing_subscriptions(status);

ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own billing" ON billing_subscriptions;
DROP POLICY IF EXISTS "Service role can manage billing" ON billing_subscriptions;
CREATE POLICY "Users can view own billing" ON billing_subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Inserts/updates done via service role in API routes

-- 3. Promo Invite Links Table
CREATE TABLE IF NOT EXISTS promo_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  free_months INTEGER NOT NULL CHECK (free_months IN (6, 12)),
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  used_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_links_code ON promo_invite_links(code);
CREATE INDEX IF NOT EXISTS idx_promo_links_active ON promo_invite_links(is_active);

ALTER TABLE promo_invite_links ENABLE ROW LEVEL SECURITY;
-- Accessed only via service role in API routes, no direct user access needed

-- 4. Grant permissions (for service role usage)
GRANT ALL ON billing_subscriptions TO authenticated;
GRANT ALL ON promo_invite_links TO authenticated;

-- 5. Triggers
DROP TRIGGER IF EXISTS update_billing_subscriptions_updated_at ON billing_subscriptions;
CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Update handle_new_user to set trial
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE base_username TEXT; final_username TEXT;
BEGIN
  base_username := SPLIT_PART(NEW.email, '@', 1); final_username := base_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN final_username := base_username || '_' || SUBSTRING(gen_random_uuid()::text, 1, 4); END IF;
  INSERT INTO public.profiles (id, username, full_name, phone, country, company_email, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    LOWER(final_username),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    NEW.email,
    NOW() + INTERVAL '30 days',
    'trialing'
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- IMPORTANT: Run this SQL in Supabase SQL Editor.
-- Existing users will NOT have trial_ends_at set.
-- To grant existing users a trial, run:
-- UPDATE profiles SET trial_ends_at = NOW() + INTERVAL '30 days', subscription_status = 'trialing' WHERE trial_ends_at IS NULL AND subscription_status IS NULL;
-- ============================================
