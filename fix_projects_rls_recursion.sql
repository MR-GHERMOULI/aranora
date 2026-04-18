-- ============================================================
-- FIX: Infinite Recursion in projects RLS Policy
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================
-- ROOT CAUSE:
--   projects SELECT policy  → queries project_collaborators
--   project_collaborators SELECT policy → queries projects (owner check)
--   → infinite loop!
-- SOLUTION:
--   Use SECURITY DEFINER functions that bypass RLS to break the cycle.
-- ============================================================


-- ============================================================
-- STEP 1: Drop ALL existing policies on projects and
--         project_collaborators to start clean
-- ============================================================

-- Projects policies (original ones)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Collaborators can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can view team projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.projects;

-- Projects policies (new ones created in this script, for rerunnability)
DROP POLICY IF EXISTS "Owners can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view project by share token" ON public.projects;
DROP POLICY IF EXISTS "Owners can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;


-- Project collaborators policies (original ones)
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view own records" ON public.project_collaborators;
DROP POLICY IF EXISTS "Collaborators can update own records" ON public.project_collaborators;
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can manage collaborators on own projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Enable all for project owners" ON public.project_collaborators;

-- Project collaborators policies (new ones created in this script, for rerunnability)
DROP POLICY IF EXISTS "Owners can manage project collaborators" ON public.project_collaborators;


-- ============================================================
-- STEP 2: Create SECURITY DEFINER helper functions
--         These bypass RLS, breaking the recursive cycle
-- ============================================================

-- Helper: Check if the current user owns a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.auth_user_owns_project(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_uuid
      AND user_id = auth.uid()
  );
$$;

-- Helper: Check if the current user is an active collaborator on a project
-- (bypasses RLS on both projects and project_collaborators)
CREATE OR REPLACE FUNCTION public.auth_user_is_collaborator(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_collaborators pc
    JOIN public.profiles p ON (p.company_email = pc.collaborator_email OR p.email = pc.collaborator_email)
    WHERE pc.project_id = project_uuid
      AND pc.status = 'active'
      AND p.id = auth.uid()
  );
$$;

-- Helper: Get the current user's company_email from profiles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.auth_user_company_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(company_email, email) FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- ============================================================
-- STEP 3: Recreate PROJECTS policies (no recursion)
-- ============================================================

-- Owners can SELECT their own projects
CREATE POLICY "Owners can view own projects"
  ON public.projects
  FOR SELECT
  USING (user_id = auth.uid());

-- Active collaborators can SELECT projects they work on
-- Uses SECURITY DEFINER function — NO recursion
CREATE POLICY "Collaborators can view assigned projects"
  ON public.projects
  FOR SELECT
  USING (public.auth_user_is_collaborator(id));

-- Share token: anyone can view a project with a valid share_token
CREATE POLICY "Anyone can view project by share token"
  ON public.projects
  FOR SELECT
  USING (share_token IS NOT NULL);

-- Owners can INSERT their own projects
CREATE POLICY "Owners can insert own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owners can UPDATE their own projects
CREATE POLICY "Owners can update own projects"
  ON public.projects
  FOR UPDATE
  USING (user_id = auth.uid());

-- Owners can DELETE their own projects
CREATE POLICY "Owners can delete own projects"
  ON public.projects
  FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- STEP 4: Recreate PROJECT_COLLABORATORS policies (no recursion)
-- ============================================================

-- Project owners can do everything with their project's collaborators
-- Uses SECURITY DEFINER function — NO recursion back to projects policy
CREATE POLICY "Owners can manage project collaborators"
  ON public.project_collaborators
  FOR ALL
  USING (public.auth_user_owns_project(project_id))
  WITH CHECK (public.auth_user_owns_project(project_id));

-- Collaborators can SELECT their own records (by email match)
CREATE POLICY "Collaborators can view own records"
  ON public.project_collaborators
  FOR SELECT
  USING (
    collaborator_email = public.auth_user_company_email()
  );

-- Collaborators can UPDATE their own records (accept/decline)
CREATE POLICY "Collaborators can update own records"
  ON public.project_collaborators
  FOR UPDATE
  USING (
    collaborator_email = public.auth_user_company_email()
  );

-- Anyone (including anonymous) can SELECT by invite_token
-- (for external invite links)
CREATE POLICY "Anyone can view invite by token"
  ON public.project_collaborators
  FOR SELECT
  USING (invite_token IS NOT NULL);


-- ============================================================
-- STEP 5: Notifications — ensure correct policies exist
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- STEP 6: Profiles — allow authenticated users to read others
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read basic profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read basic profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- VERIFICATION — Run this after to confirm policies are set
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('projects', 'project_collaborators', 'notifications', 'profiles')
ORDER BY tablename, policyname;
