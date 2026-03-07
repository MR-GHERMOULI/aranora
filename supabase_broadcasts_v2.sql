-- supabase_broadcasts_v2.sql
-- Add is_archived column to the broadcasts table

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'broadcasts' AND column_name = 'is_archived') THEN
    ALTER TABLE broadcasts ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create an index for faster filtering of non-archived broadcasts
CREATE INDEX IF NOT EXISTS idx_broadcasts_archived ON broadcasts(is_archived);
