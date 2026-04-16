-- Drop the existing check constraint on the projects table
ALTER TABLE IF EXISTS public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

-- Update any legacy rows to the new default to prevent constraint violations
UPDATE public.projects 
  SET status = 'Planning' 
  WHERE status = 'Pending';

-- Add the new updated check constraint that matches the Next.js UI enum schema
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'));
