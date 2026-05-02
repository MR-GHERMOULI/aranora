-- ============================================
-- Aranora Device & IP Tracking Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table to log every access (login or session refresh)
CREATE TABLE IF NOT EXISTS user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_access_ip ON user_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_created ON user_access_logs(created_at DESC);

-- 2. Add last_ip and last_ua to profiles for quick access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_ip') THEN
    ALTER TABLE profiles ADD COLUMN last_ip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_ua') THEN
    ALTER TABLE profiles ADD COLUMN last_ua TEXT;
  END IF;
END $$;

-- 3. Grant permissions
GRANT ALL ON user_access_logs TO authenticated;
GRANT ALL ON user_access_logs TO service_role;
