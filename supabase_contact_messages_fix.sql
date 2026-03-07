-- ============================================
-- CONTACT MESSAGES TABLE FIX
-- Run this in Supabase SQL Editor
-- This is safe to run multiple times (idempotent)
-- ============================================

-- 1. Create the contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add is_read column if it was somehow missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_messages'
      AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.contact_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON public.contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies and recreate cleanly
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin full access" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow anon insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_admin_policy" ON public.contact_messages;

-- 6. Allow anyone (including anonymous users) to INSERT
CREATE POLICY "Allow public insert"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- 7. Allow authenticated admins full access (SELECT, UPDATE, DELETE)
CREATE POLICY "Allow admin full access"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 8. Grant permissions
GRANT ALL ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;

-- ============================================
-- VERIFICATION: Run these to confirm everything is set up correctly
-- ============================================
-- Check table exists:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'contact_messages';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'contact_messages';

-- Check policies:
-- SELECT policyname, cmd, roles FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'contact_messages';
