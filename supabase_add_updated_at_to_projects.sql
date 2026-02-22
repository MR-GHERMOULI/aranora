-- ==============================================================================
-- ADD MISSING updated_at COLUMN TO projects TABLE
-- ==============================================================================
-- 
-- The "projects" table has a trigger "update_projects_updated_at", but the
-- "updated_at" column is missing from the table in your live Supabase database.
-- Run this in the Supabase SQL Editor to fix the issue where projects cannot
-- be updated (which breaks the share link toggle).
-- 
-- ==============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'updated_at') THEN
    ALTER TABLE projects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
