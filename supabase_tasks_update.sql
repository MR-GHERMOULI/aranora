-- ============================================
-- Update Tasks Table for Personal Task Planner
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add new columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('Personal', 'Work')) DEFAULT 'Work',
ADD COLUMN IF NOT EXISTS recurrence jsonb DEFAULT null,
ADD COLUMN IF NOT EXISTS is_personal boolean DEFAULT false;

-- 2. Update status check constraint to include 'Postponed'
-- We have to drop the existing constraint first. 
-- Note: The constraint name might vary, checking default naming convention or trying to find it is hard in SQL script without logic.
-- Assuming standard naming or re-creating column constraints.
-- SAFEST WAY: Drop the constraint if known, or just alter the column type/check.
-- PostgreSQL doesn't allow easily "modifying" a check constraint, we drop and add.

DO $$ 
BEGIN
  -- Try to drop common constraint names if they exist, or the column constraint
  ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
  
  -- Add new constraint
  ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('Todo', 'In Progress', 'Done', 'Postponed'));
END $$;

-- 3. Update existing rows if necessary (optional)
UPDATE public.tasks SET priority = 'Medium' WHERE priority IS NULL;
UPDATE public.tasks SET is_personal = false WHERE is_personal IS NULL;
