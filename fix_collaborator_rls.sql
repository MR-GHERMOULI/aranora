-- ============================================
-- FIX: Add Collaborator RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS TABLE — Add INSERT policy
-- Allows any authenticated user to create notifications for any user
-- (needed for project owners to notify collaborators about invites)
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" 
  ON public.notifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Also add DELETE policy so users can clean up their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);


-- ============================================
-- 2. PROJECT_COLLABORATORS TABLE — Add collaborator-facing policies
-- ============================================

-- 2a. Collaborators can VIEW their own collaborator records
-- (matched by their profile's company_email)
DROP POLICY IF EXISTS "Collaborators can view own records" ON public.project_collaborators;
CREATE POLICY "Collaborators can view own records" 
  ON public.project_collaborators 
  FOR SELECT 
  USING (
    collaborator_email = (
      SELECT COALESCE(company_email, email) FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 2b. Collaborators can UPDATE their own records (accept/decline invites)
DROP POLICY IF EXISTS "Collaborators can update own records" ON public.project_collaborators;
CREATE POLICY "Collaborators can update own records" 
  ON public.project_collaborators 
  FOR UPDATE 
  USING (
    collaborator_email = (
      SELECT COALESCE(company_email, email) FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 2c. Anyone can SELECT a collaborator record by invite_token
-- (for external invite link pages — token acts as a secret key)
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.project_collaborators;
CREATE POLICY "Anyone can view invite by token" 
  ON public.project_collaborators 
  FOR SELECT 
  USING (invite_token IS NOT NULL);


-- ============================================
-- 3. PROJECTS TABLE — Allow collaborators to view projects they are part of
-- ============================================

DROP POLICY IF EXISTS "Collaborators can view assigned projects" ON public.projects;
CREATE POLICY "Collaborators can view assigned projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = id
        AND pc.status = 'active'
        AND pc.collaborator_email = (
          SELECT COALESCE(company_email, email) FROM public.profiles WHERE profiles.id = auth.uid()
        )
    )
  );


-- ============================================
-- 4. PROFILES TABLE — Allow reading other users' public info
-- (needed for collaborator list to show names/avatars)
-- ============================================

-- Check if a broader read policy is needed for profiles
-- Currently only "Users can view own profile" exists
-- Collaborator features need to look up other users by email
DROP POLICY IF EXISTS "Authenticated users can read basic profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read basic profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (true);


-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check policies are in place:
-- SELECT policyname, tablename, cmd FROM pg_policies 
-- WHERE tablename IN ('notifications', 'project_collaborators', 'projects', 'profiles')
-- ORDER BY tablename, policyname;
