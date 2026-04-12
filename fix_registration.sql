-- ============================================================
-- ARANORA — REGISTRATION FIX
-- Run this entirely in Supabase SQL Editor → New Query
-- ============================================================

-- 1. Ensure the 'email' column exists on profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 2. Ensure 'trial_ends_at' column exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Ensure 'subscription_status' column exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
  END IF;
END $$;

-- 4. Fix the CHECK constraint to include 'affiliate'
--    (affiliate users need this value — without it updates fail)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN (
    'trialing', 'active', 'past_due', 'canceled', 'expired', 'affiliate'
  ));

-- 5. THE MAIN FIX: Replace handle_new_user() with a robust version
--    Key improvements:
--    • Includes ALL required columns (email, trial_ends_at, subscription_status)
--    • EXCEPTION handler → trigger crash can NEVER block registration again
--    • ON CONFLICT (id) DO NOTHING → safe on retries
--    • Loop for unique username (not single attempt)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  attempts      INT := 0;
BEGIN
  -- Build a clean username from the email prefix
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Loop until we find a unique username (max 10 tries)
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE username = final_username
  ) AND attempts < 10 LOOP
    attempts       := attempts + 1;
    final_username := base_username || '_' || SUBSTRING(gen_random_uuid()::text, 1, 4);
  END LOOP;

  -- Insert the new profile row
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
  ) VALUES (
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
  ON CONFLICT (id) DO NOTHING;  -- safe on duplicate

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log but NEVER block user creation
  RAISE WARNING 'handle_new_user() error for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Recreate the trigger (clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Make notify_admin_new_user() safe too
--    (any failure here was also blocking registration)
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Recreate admin notification trigger
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON auth.users;
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

-- 9. Backfill: give any existing users a trial if they have none
UPDATE profiles
SET
  trial_ends_at       = NOW() + INTERVAL '30 days',
  subscription_status = 'trialing'
WHERE
  trial_ends_at       IS NULL
  AND subscription_status IS NULL;

-- 10. Backfill: fill email from company_email if missing
UPDATE profiles
SET email = company_email
WHERE email IS NULL AND company_email IS NOT NULL;

-- ============================================================
-- VERIFICATION — run after the above to confirm everything:
-- ============================================================
-- 1) Check triggers are installed:
--    SELECT tgname, proname
--    FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
--    WHERE tgrelid = 'auth.users'::regclass;
--
--    Expected rows:
--      on_auth_user_created     | handle_new_user
--      on_new_user_notify_admin | notify_admin_new_user
--
-- 2) Check profiles columns exist:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'profiles'
--    ORDER BY ordinal_position;
-- ============================================================
