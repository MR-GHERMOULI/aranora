-- 1. Make user_id nullable to allow inviting non-platform users
ALTER TABLE public.team_members ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add email column to track who was invited (especially for non-users)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Update helper functions to respect member status
-- We want to ensure only 'active' members are considered for access
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id 
      AND user_id = auth.uid() 
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'manager') -- Added 'manager' as it is used in the app
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Update team_members RLS to use the safer functions and allow view of invitations
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT
  USING (
    public.is_team_member(team_id) 
    OR public.is_team_admin(team_id)
    OR user_id = auth.uid()
  );

-- 5. Fix team_member_projects RLS to avoid potential issues
DROP POLICY IF EXISTS "Team owners can manage assignments" ON public.team_member_projects;
CREATE POLICY "Team admins can manage assignments"
  ON public.team_member_projects FOR ALL
  USING (
    public.is_team_admin((SELECT team_id FROM public.team_members WHERE id = team_member_id))
  );

DROP POLICY IF EXISTS "Members can view their own assignments" ON public.team_member_projects;
CREATE POLICY "Members can view their own assignments"
  ON public.team_member_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE id = team_member_id AND user_id = auth.uid()
    )
  );

-- 6. Add index for email search
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

SELECT 'Team logic and schema fixed!' AS status;
