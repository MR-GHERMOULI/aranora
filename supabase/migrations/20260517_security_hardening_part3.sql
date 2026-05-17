-- ═══════════════════════════════════════════════════════════════════════
-- Security Hardening Part 3: RLS Helper Isolation
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. Fix trigger function execution by authenticated users
-- ────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.increment_intake_submission_count() FROM authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- 2. Create private schema for RLS helpers to avoid public exposure
-- This satisfies the Supabase Linter without causing infinite recursion.
-- ────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_team_member(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION private.is_team_admin(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ────────────────────────────────────────────────────────────────────────
-- 3. Recreate policies to use the new private schema functions
-- ────────────────────────────────────────────────────────────────────────

-- Teams
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
CREATE POLICY "Users can view their teams" ON public.teams FOR SELECT USING (private.is_team_member(id));

-- Team Members
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT USING (private.is_team_member(team_id));

DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;
CREATE POLICY "Team admins can manage members" ON public.team_members FOR ALL USING (private.is_team_admin(team_id));

DROP POLICY IF EXISTS "Users can remove themselves" ON public.team_members;
CREATE POLICY "Users can remove themselves" ON public.team_members FOR DELETE USING (auth.uid() = user_id OR private.is_team_admin(team_id));

-- Team Invitations
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
CREATE POLICY "Team members can view invitations" ON public.team_invitations FOR SELECT USING (private.is_team_member(team_id));

DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
CREATE POLICY "Team admins can create invitations" ON public.team_invitations FOR INSERT WITH CHECK (private.is_team_admin(team_id));

-- Projects
DROP POLICY IF EXISTS "Team members can view team projects" ON public.projects;
CREATE POLICY "Team members can view team projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can update team projects" ON public.projects;
CREATE POLICY "Team members can update team projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

DROP POLICY IF EXISTS "Team members can delete team projects" ON public.projects;
CREATE POLICY "Team members can delete team projects" ON public.projects FOR DELETE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

-- Clients
DROP POLICY IF EXISTS "Team members can view team clients" ON public.clients;
CREATE POLICY "Team members can view team clients" ON public.clients FOR SELECT USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can update team clients" ON public.clients;
CREATE POLICY "Team members can update team clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can delete team clients" ON public.clients;
CREATE POLICY "Team members can delete team clients" ON public.clients FOR DELETE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

-- Invoices
DROP POLICY IF EXISTS "Team members can view team invoices" ON public.invoices;
CREATE POLICY "Team members can view team invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can update team invoices" ON public.invoices;
CREATE POLICY "Team members can update team invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can delete team invoices" ON public.invoices;
CREATE POLICY "Team members can delete team invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

-- Tasks
DROP POLICY IF EXISTS "Team members can view team tasks" ON public.tasks;
CREATE POLICY "Team members can view team tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can update team tasks" ON public.tasks;
CREATE POLICY "Team members can update team tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

DROP POLICY IF EXISTS "Team members can delete team tasks" ON public.tasks;
CREATE POLICY "Team members can delete team tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

-- Time Entries
DROP POLICY IF EXISTS "Team members can view team time entries" ON public.time_entries;
CREATE POLICY "Team members can view team time entries" ON public.time_entries FOR SELECT USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members can update team time entries" ON public.time_entries;
CREATE POLICY "Team members can update team time entries" ON public.time_entries FOR UPDATE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));

DROP POLICY IF EXISTS "Team members can delete team time entries" ON public.time_entries;
CREATE POLICY "Team members can delete team time entries" ON public.time_entries FOR DELETE USING (auth.uid() = user_id OR (team_id IS NOT NULL AND private.is_team_admin(team_id)));


-- ────────────────────────────────────────────────────────────────────────
-- 4. Safely drop the old public schema functions
-- ────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.is_team_admin(uuid);
DROP FUNCTION IF EXISTS public.is_team_member(uuid);
