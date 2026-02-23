-- Fix Settings Page (Profiles Table)
DO $$ BEGIN
  -- Add missing columns to profiles table allowing settings to save
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'logo_url') THEN
    ALTER TABLE profiles ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'default_paper_size') THEN
    ALTER TABLE profiles ADD COLUMN default_paper_size TEXT DEFAULT 'A4';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'default_tax_rate') THEN
    ALTER TABLE profiles ADD COLUMN default_tax_rate NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Cleanup deprecated Team features
DROP TABLE IF EXISTS team_members CASCADE;
