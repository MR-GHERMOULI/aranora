-- ============================================
-- Aranora Affiliate Click Tracking Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Affiliate Link Clicks Table (tracks every click on referral links)
CREATE TABLE IF NOT EXISTS affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aff_clicks_affiliate_id ON affiliate_link_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_clicked_at ON affiliate_link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_affiliate_date ON affiliate_link_clicks(affiliate_id, clicked_at);

ALTER TABLE affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own click records
DROP POLICY IF EXISTS "Affiliates can view own clicks" ON affiliate_link_clicks;
CREATE POLICY "Affiliates can view own clicks" ON affiliate_link_clicks FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Service role can insert (used by API route)
GRANT ALL ON affiliate_link_clicks TO authenticated;

-- 2. Add total_clicks column to affiliates table for fast dashboard display
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'total_clicks'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN total_clicks INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- IMPORTANT: Run this SQL in Supabase SQL Editor.
-- After running, affiliate click tracking will be enabled.
-- ============================================
