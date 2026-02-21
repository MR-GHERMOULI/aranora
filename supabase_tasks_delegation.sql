-- Add assigned_to column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure other columns used in code exist (if not already added in previous turns)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update RLS policies for tasks to be more collaborative
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- SELECT: Creator, Assignee, OR Project Member
CREATE POLICY "Tasks visibility" ON tasks FOR SELECT USING (
  auth.uid() = user_id 
  OR auth.uid() = assigned_to
  OR (
    project_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM project_collaborators pc 
        WHERE pc.project_id = tasks.project_id 
        AND pc.collaborator_email = (SELECT company_email FROM profiles WHERE id = auth.uid())
      )
    )
  )
);

-- INSERT: Anyone can create personal tasks. Project members can create project tasks.
CREATE POLICY "Tasks creation" ON tasks FOR INSERT WITH CHECK (
  (project_id IS NULL AND auth.uid() = user_id)
  OR (
    project_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM project_collaborators pc 
        WHERE pc.project_id = project_id 
        AND pc.collaborator_email = (SELECT company_email FROM profiles WHERE id = auth.uid())
      )
    )
  )
);

-- UPDATE: Creator, Assignee, OR Project Owner
CREATE POLICY "Tasks update" ON tasks FOR UPDATE USING (
  auth.uid() = user_id 
  OR auth.uid() = assigned_to
  OR EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
);

-- DELETE: Creator OR Project Owner
CREATE POLICY "Tasks deletion" ON tasks FOR DELETE USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
);
