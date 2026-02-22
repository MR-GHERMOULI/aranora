-- ============================================
-- Add share_token to projects for public progress sharing
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add share_token column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS share_token UUID;

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON public.projects(share_token);

-- 3. Allow anonymous read of shared projects (limited columns)
DROP POLICY IF EXISTS "Anyone can view project by share_token" ON projects;
CREATE POLICY "Anyone can view project by share_token"
  ON projects FOR SELECT
  USING (share_token IS NOT NULL);

-- 4. Allow anonymous read of tasks for shared projects
DROP POLICY IF EXISTS "Anyone can view tasks of shared projects" ON tasks;
CREATE POLICY "Anyone can view tasks of shared projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
        AND projects.share_token IS NOT NULL
    )
  );
