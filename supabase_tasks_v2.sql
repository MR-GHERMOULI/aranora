-- ============================================
-- Tasks V2: Professional To-Do List Upgrade
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add labels column (text array for colored tags)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- 2. Add sort_order for custom user ordering
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 3. Add completed_at timestamp for analytics
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT null;

-- 4. Add subtask_of for parent-child task relationships
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS subtask_of uuid REFERENCES public.tasks(id) ON DELETE CASCADE DEFAULT null;

-- 5. Create index for faster subtask lookups
CREATE INDEX IF NOT EXISTS idx_tasks_subtask_of ON public.tasks(subtask_of);

-- 6. Create index for faster label searches
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON public.tasks USING GIN(labels);

-- 7. Create index for sort_order
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(user_id, sort_order);

-- 8. Set completed_at for existing done tasks
UPDATE public.tasks 
SET completed_at = created_at 
WHERE status = 'Done' AND completed_at IS NULL;
