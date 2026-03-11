-- ============================================
-- Aranora Affiliate Marketing System Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Affiliates Table (registered partners)
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  affiliate_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  company_name TEXT,
  website TEXT,
  payment_method TEXT CHECK (payment_method IN ('paypal', 'bank_transfer', 'wise')),
  payment_details JSONB DEFAULT '{}',
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own record" ON affiliates;
CREATE POLICY "Affiliates can view own record" ON affiliates FOR SELECT USING (auth.uid() = user_id);

-- 2. Affiliate Referrals Table (tracks signups via referral link)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  subscription_id UUID REFERENCES billing_subscriptions ON DELETE SET NULL,
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'subscribed', 'expired', 'churned')),
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')),
  commission_eligible_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON affiliate_referrals(status);

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals" ON affiliate_referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- 3. Affiliate Commissions Table (individual commission records per invoice)
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES affiliate_referrals ON DELETE CASCADE NOT NULL,
  invoice_stripe_id TEXT,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'yearly')),
  invoice_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  commission_month INTEGER CHECK (commission_month >= 1 AND commission_month <= 12),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON affiliate_commissions(status);

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- 4. Affiliate Payouts Table (payout requests & history)
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON affiliate_payouts(status);

ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON affiliate_payouts;
CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- 5. Add referred_by column to profiles for tracking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by_affiliate') THEN
    ALTER TABLE profiles ADD COLUMN referred_by_affiliate TEXT;
  END IF;
END $$;

-- 6. Grant permissions (for service role usage)
GRANT ALL ON affiliates TO authenticated;
GRANT ALL ON affiliate_referrals TO authenticated;
GRANT ALL ON affiliate_commissions TO authenticated;
GRANT ALL ON affiliate_payouts TO authenticated;

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_affiliates_updated_at ON affiliates;
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- IMPORTANT: Run this SQL in Supabase SQL Editor.
-- After running, affiliates can register through the platform.
-- ============================================
