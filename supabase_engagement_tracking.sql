-- ============================================
-- Aranora User Engagement Tracking Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table to log user events (feature usage tracking)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Event identification
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('critical', 'high', 'medium', 'engagement', 'passive')),
  event_weight INTEGER DEFAULT 1,
  
  -- Context (privacy-safe — no client data)
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_name ON user_events(event_name);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_date ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(event_category);

-- RLS: Only service_role can write; users can read their own
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own events" ON user_events;
CREATE POLICY "Users can view own events" ON user_events 
  FOR SELECT USING (auth.uid() = user_id);

GRANT ALL ON user_events TO service_role;
GRANT SELECT ON user_events TO authenticated;

-- 2. Table for daily Health Score snapshots
CREATE TABLE IF NOT EXISTS user_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Score
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining', 'critical')),
  
  -- Breakdown
  login_score INTEGER DEFAULT 0,
  core_action_score INTEGER DEFAULT 0,
  feature_breadth_score INTEGER DEFAULT 0,
  consistency_score INTEGER DEFAULT 0,
  
  -- Stats
  events_7d INTEGER DEFAULT 0,
  events_30d INTEGER DEFAULT 0,
  last_core_action_at TIMESTAMPTZ,
  features_used TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  
  -- Period
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_health_scores_user ON user_health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_date ON user_health_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON user_health_scores(score);

ALTER TABLE user_health_scores ENABLE ROW LEVEL SECURITY;
GRANT ALL ON user_health_scores TO service_role;

-- 3. Add engagement columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'health_score') THEN
    ALTER TABLE profiles ADD COLUMN health_score INTEGER DEFAULT 50;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'health_trend') THEN
    ALTER TABLE profiles ADD COLUMN health_trend TEXT DEFAULT 'stable';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
    ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'engagement_alerts_sent') THEN
    ALTER TABLE profiles ADD COLUMN engagement_alerts_sent INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Optimized index for the engagement dashboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_health_score ON profiles(health_score);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
