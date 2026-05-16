-- Drop all possible previous policies on team_members to clear out recursive ones
DROP POLICY IF EXISTS "Users can view members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Team admins/owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins/owners can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins/owners can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.team_members;
DROP POLICY IF EXISTS "Users can remove themselves" ON public.team_members;

-- Redefine helper functions with SECURITY DEFINER and explicit search_path
-- This ensures they run as the definer (superuser) and bypass RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate policies using the safe helper functions
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT
  USING (public.is_team_member(team_id));

CREATE POLICY "Team admins can manage members" ON public.team_members FOR ALL
  USING (public.is_team_admin(team_id));

CREATE POLICY "Users can insert themselves" ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves" ON public.team_members FOR DELETE
  USING (auth.uid() = user_id OR public.is_team_admin(team_id));

SELECT 'Team members RLS recursion fixed!' AS status;
