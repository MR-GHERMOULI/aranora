-- Step 1: Drop ALL dependent policies by name variant (covers underscore and space versions)
DROP POLICY IF EXISTS "Anyone can view tasks of shared projects" ON tasks;
DROP POLICY IF EXISTS "Anyone can view project by share_token" ON projects;
DROP POLICY IF EXISTS "Anyone can view project by share token" ON projects;

-- Step 2: Convert share_token from UUID to TEXT
ALTER TABLE projects 
ALTER COLUMN share_token TYPE TEXT USING share_token::text;

-- Step 3: Recreate the project SELECT policy
CREATE POLICY "Anyone can view project by share_token"
ON projects
FOR SELECT
USING (share_token IS NOT NULL);

-- Step 4: Recreate the tasks SELECT policy
CREATE POLICY "Anyone can view tasks of shared projects"
ON tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tasks.project_id
      AND projects.share_token IS NOT NULL
  )
);
