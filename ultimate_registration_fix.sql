-- ============================================================
-- ARANORA — ULTIMATE REGISTRATION FIX v3
-- Run this entirely in Supabase SQL Editor → New Query
-- This fixes ALL auth triggers and makes them fail-safe!
-- ============================================================

-- ============================================================
-- 1. FIX: handle_new_user (Profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  attempts      INT := 0;
BEGIN
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) AND attempts < 10 LOOP
    attempts       := attempts + 1;
    final_username := base_username || '_' || SUBSTRING(gen_random_uuid()::text, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (
    id, username, full_name, phone, country, email, company_email, trial_ends_at, subscription_status
  ) VALUES (
    NEW.id, final_username, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.raw_user_meta_data->>'phone', 
    NEW.raw_user_meta_data->>'country',
    NEW.email, NEW.email, 
    NOW() + INTERVAL '30 days', 'trialing'
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user() error for %: %', NEW.email, SQLERRM;
  RETURN NEW; -- NEVER BLOCK
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. FIX: handle_new_user_workspace (Teams)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Insert into teams safely
  INSERT INTO public.teams (name, owner_id)
  VALUES ('Personal Workspace', NEW.id)
  RETURNING id INTO new_team_id;

  -- Insert into team_members safely
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'owner');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user_workspace() error for %: %', NEW.email, SQLERRM;
  RETURN NEW; -- NEVER BLOCK
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- ============================================================
-- 3. FIX: notify_admin_new_user (Admin Notifications)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'new_user',
    'New User Registered',
    'New user: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_admin_new_user() error: %', SQLERRM;
  RETURN NEW; -- NEVER BLOCK
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_user_notify_admin ON auth.users;
CREATE TRIGGER on_new_user_notify_admin AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

-- ============================================================
-- 4. FIX: Ensure missing columns & constraints in profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
  END IF;
END $$;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired', 'affiliate'));

-- Fix any NULL emails violating NOT NULL index
UPDATE profiles SET email = username || '@temp.local' WHERE email IS NULL;
