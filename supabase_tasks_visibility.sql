-- Add visible_to column for granular task access
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visible_to UUID[] DEFAULT '{}';

-- Update RLS SELECT policy for tasks
DROP POLICY IF EXISTS "Tasks visibility" ON tasks;

CREATE POLICY "Tasks visibility" ON tasks FOR SELECT USING (
  -- 1. I am the creator
  auth.uid() = user_id 
  -- 2. I am the assignee
  OR auth.uid() = assigned_to
  -- 3. I am explicitly in the visibility list
  OR auth.uid() = ANY(visible_to)
  -- 4. I am the owner of the project this task belongs to
  OR (
    project_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  )
);

-- Update RLS UPDATE policy to include those in visibility list if needed? 
-- Usually only creator, assignee or owner can update. 
-- Let's keep update as is (Creator, Assignee, Project Owner).
