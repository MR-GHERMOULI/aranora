-- ============================================
-- Aranora Team Enhancement Migration v2
-- Handles existing legacy team_members schema
-- Run this in your Supabase SQL editor
-- ============================================

-- ─────────────────────────────────────────────
-- STEP 0: Handle legacy team_members table
-- The old table used (team_owner_id, member_email).
-- We rename it so we can create the modern version.
-- ─────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_members'
      AND column_name = 'team_owner_id'
  ) THEN
    ALTER TABLE public.team_members RENAME TO team_members_legacy;
    RAISE NOTICE 'Renamed legacy team_members to team_members_legacy';
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 1: Create core team tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- STEP 2: Add team_id / assigned_to columns
-- to existing tables (idempotent)
-- ─────────────────────────────────────────────

ALTER TABLE public.projects     ADD COLUMN IF NOT EXISTS team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.clients      ADD COLUMN IF NOT EXISTS team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.invoices     ADD COLUMN IF NOT EXISTS team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tasks        ADD COLUMN IF NOT EXISTS team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tasks        ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- STEP 3: Create indexes
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_team_members_team_id      ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id      ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id  ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token    ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_projects_team_id          ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_clients_team_id           ON public.clients(team_id);
CREATE INDEX IF NOT EXISTS idx_invoices_team_id          ON public.invoices(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id             ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to         ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_time_entries_team_id      ON public.time_entries(team_id);

-- ─────────────────────────────────────────────
-- STEP 4: Enable RLS on new tables
-- ─────────────────────────────────────────────

ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- STEP 5: Helper functions for RLS
-- (avoids self-referential subquery problem)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────
-- STEP 6: RLS policies for team tables
-- ─────────────────────────────────────────────

-- Teams
DROP POLICY IF EXISTS "Users can view their teams"   ON public.teams;
DROP POLICY IF EXISTS "Users can create teams"        ON public.teams;
DROP POLICY IF EXISTS "Owners can update teams"       ON public.teams;
DROP POLICY IF EXISTS "Owners can delete teams"       ON public.teams;

CREATE POLICY "Users can view their teams" ON public.teams FOR SELECT
  USING (public.is_team_member(id));

CREATE POLICY "Users can create teams" ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update teams" ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete teams" ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- Team Members
DROP POLICY IF EXISTS "Members can view team members"   ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage members"  ON public.team_members;
DROP POLICY IF EXISTS "Users can insert themselves"     ON public.team_members;
DROP POLICY IF EXISTS "Users can remove themselves"     ON public.team_members;

CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT
  USING (public.is_team_member(team_id));

CREATE POLICY "Team admins can manage members" ON public.team_members FOR ALL
  USING (public.is_team_admin(team_id));

CREATE POLICY "Users can insert themselves" ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves" ON public.team_members FOR DELETE
  USING (auth.uid() = user_id OR public.is_team_admin(team_id));

-- Team Invitations
DROP POLICY IF EXISTS "Team members can view invitations"     ON public.team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations"    ON public.team_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON public.team_invitations;

CREATE POLICY "Team members can view invitations" ON public.team_invitations FOR SELECT
  USING (public.is_team_member(team_id));

CREATE POLICY "Team admins can create invitations" ON public.team_invitations FOR INSERT
  WITH CHECK (public.is_team_admin(team_id));

CREATE POLICY "Invitees can update invitation status" ON public.team_invitations FOR UPDATE
  USING (true);

-- ─────────────────────────────────────────────
-- STEP 7: RLS policies for data tables
-- ─────────────────────────────────────────────

-- Projects
DROP POLICY IF EXISTS "Team members can view team projects"   ON public.projects;
DROP POLICY IF EXISTS "Team members can create team projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can update team projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can delete team projects" ON public.projects;

CREATE POLICY "Team members can view team projects" ON public.projects FOR SELECT
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can create team projects" ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update team projects" ON public.projects FOR UPDATE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

CREATE POLICY "Team members can delete team projects" ON public.projects FOR DELETE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

-- Clients
DROP POLICY IF EXISTS "Team members can view team clients"   ON public.clients;
DROP POLICY IF EXISTS "Team members can create team clients" ON public.clients;
DROP POLICY IF EXISTS "Team members can update team clients" ON public.clients;
DROP POLICY IF EXISTS "Team members can delete team clients" ON public.clients;

CREATE POLICY "Team members can view team clients" ON public.clients FOR SELECT
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can create team clients" ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update team clients" ON public.clients FOR UPDATE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can delete team clients" ON public.clients FOR DELETE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

-- Invoices
DROP POLICY IF EXISTS "Team members can view team invoices"   ON public.invoices;
DROP POLICY IF EXISTS "Team members can create team invoices" ON public.invoices;
DROP POLICY IF EXISTS "Team members can update team invoices" ON public.invoices;
DROP POLICY IF EXISTS "Team members can delete team invoices" ON public.invoices;

CREATE POLICY "Team members can view team invoices" ON public.invoices FOR SELECT
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can create team invoices" ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update team invoices" ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can delete team invoices" ON public.invoices FOR DELETE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

-- Tasks
DROP POLICY IF EXISTS "Team members can view team tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Team members can create team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can delete team tasks" ON public.tasks;

CREATE POLICY "Team members can view team tasks" ON public.tasks FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
    OR (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

CREATE POLICY "Team members can create team tasks" ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update team tasks" ON public.tasks FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
    OR (team_id IS NOT NULL AND public.is_team_admin(team_id))
  );

CREATE POLICY "Team members can delete team tasks" ON public.tasks FOR DELETE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

-- Time Entries
DROP POLICY IF EXISTS "Team members can view team time entries"   ON public.time_entries;
DROP POLICY IF EXISTS "Team members can create team time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Team members can update team time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Team members can delete team time entries" ON public.time_entries;

CREATE POLICY "Team members can view team time entries" ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

CREATE POLICY "Team members can create team time entries" ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update team time entries" ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

CREATE POLICY "Team members can delete team time entries" ON public.time_entries FOR DELETE
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id)));

-- Profiles: teammates can see each other
DROP POLICY IF EXISTS "Team members can view teammate profiles" ON public.profiles;
CREATE POLICY "Team members can view teammate profiles" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm1
      WHERE tm1.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.team_members tm2
          WHERE tm2.team_id = tm1.team_id AND tm2.user_id = profiles.id
        )
    )
  );

-- ─────────────────────────────────────────────
-- STEP 8: Auto-create workspace on signup
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO public.teams (name, owner_id)
  VALUES ('Personal Workspace', NEW.id)
  RETURNING id INTO new_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- ─────────────────────────────────────────────
-- STEP 9: Backfill existing user data
-- ─────────────────────────────────────────────

-- Create personal workspaces for users who don't have one
DO $$
DECLARE
  rec RECORD;
  new_team_id UUID;
BEGIN
  FOR rec IN
    SELECT au.id FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = au.id)
  LOOP
    INSERT INTO public.teams (name, owner_id)
    VALUES ('Personal Workspace', rec.id)
    RETURNING id INTO new_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, rec.id, 'owner');
  END LOOP;
END;
$$;

-- Assign existing data rows to each user's personal workspace
-- Disable user triggers temporarily to avoid tables with broken updated_at triggers
ALTER TABLE public.clients      DISABLE TRIGGER USER;
ALTER TABLE public.projects     DISABLE TRIGGER USER;
ALTER TABLE public.invoices     DISABLE TRIGGER USER;
ALTER TABLE public.tasks        DISABLE TRIGGER USER;
ALTER TABLE public.time_entries DISABLE TRIGGER USER;

DO $$
DECLARE
  rec RECORD;
  user_team_id UUID;
BEGIN
  FOR rec IN SELECT id FROM public.profiles LOOP
    SELECT tm.team_id INTO user_team_id
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE tm.user_id = rec.id
    ORDER BY t.created_at ASC
    LIMIT 1;

    IF user_team_id IS NOT NULL THEN
      UPDATE public.projects     SET team_id = user_team_id WHERE user_id = rec.id AND team_id IS NULL;
      UPDATE public.clients      SET team_id = user_team_id WHERE user_id = rec.id AND team_id IS NULL;
      UPDATE public.invoices     SET team_id = user_team_id WHERE user_id = rec.id AND team_id IS NULL;
      UPDATE public.tasks        SET team_id = user_team_id WHERE user_id = rec.id AND team_id IS NULL;
      UPDATE public.tasks        SET assigned_to = rec.id   WHERE user_id = rec.id AND assigned_to IS NULL;
      UPDATE public.time_entries SET team_id = user_team_id WHERE user_id = rec.id AND team_id IS NULL;
    END IF;
  END LOOP;
END;
$$;

-- Re-enable user triggers
ALTER TABLE public.clients      ENABLE TRIGGER USER;
ALTER TABLE public.projects     ENABLE TRIGGER USER;
ALTER TABLE public.invoices     ENABLE TRIGGER USER;
ALTER TABLE public.tasks        ENABLE TRIGGER USER;
ALTER TABLE public.time_entries ENABLE TRIGGER USER;

SELECT 'Migration complete! Your legacy team_members data is preserved in team_members_legacy.' AS status;
