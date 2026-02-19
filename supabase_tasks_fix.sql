-- ============================================
-- Fix: Missing updated_at column on tasks table
-- Run this in Supabase SQL Editor to fix 
-- "record 'new' has no field 'updated_at'" error
-- ============================================

-- 1. Add the column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Ensure the trigger exists (Supabase boilerplate)
-- (If you already have a general handle_updated_at function)
-- CREATE TRIGGER handle_tasks_updated_at
-- BEFORE UPDATE ON public.tasks
-- FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- 3. Set existing rows to have an updated_at
UPDATE public.tasks SET updated_at = now() WHERE updated_at IS NULL;
