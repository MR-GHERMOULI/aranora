-- ============================================
-- FIX: handle_new_user() Trigger Function
-- Merges billing + security versions into one
-- definitive, robust implementation.
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1. Create or replace the definitive handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  attempts INT := 0;
BEGIN
  -- Generate a unique username from the email prefix
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Remove any non-alphanumeric characters from the base
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  -- Ensure the base is not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Loop to find a unique username (handles edge cases better than single retry)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) AND attempts < 10 LOOP
    attempts := attempts + 1;
    final_username := base_username || '_' || SUBSTRING(gen_random_uuid()::text, 1, 4);
  END LOOP;

  -- Insert profile row with ALL required columns
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    phone,
    country,
    email,
    company_email,
    trial_ends_at,
    subscription_status
  )
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    NEW.email,
    NEW.email,
    NOW() + INTERVAL '30 days',
    'trialing'
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent crash on duplicate

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Recreate the trigger (drop first to ensure clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure the 'email' column exists on profiles (some versions don't have it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 4. Backfill email column for any existing profiles that are missing it
UPDATE profiles
SET email = company_email
WHERE email IS NULL AND company_email IS NOT NULL;

-- ============================================
-- VERIFICATION: Run this after to confirm
-- ============================================
-- SELECT tgname, tgrelid::regclass, proname
-- FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgrelid = 'auth.users'::regclass;
--
-- Expected output should show:
--   on_auth_user_created | auth.users | handle_new_user
-- ============================================
