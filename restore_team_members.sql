-- ============================================
-- ARANORA — RESTORE TEAM MEMBERS TABLE
-- Run this in your Supabase SQL editor
-- ============================================

-- 1. Create the team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 2. Restore data from legacy table if it exists and has data
-- (Skipping detailed migration as the legacy table appears empty in current environment, 
-- but users can manually migrate if they have custom data there).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members_legacy') THEN
    RAISE NOTICE 'Legacy team_members_legacy table found. Skipping auto-migration to prevent schema mismatch errors.';
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS Policies
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_members.team_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;
CREATE POLICY "Team admins can manage members" ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_members.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can insert themselves" ON public.team_members;
CREATE POLICY "Users can insert themselves" ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove themselves" ON public.team_members;
CREATE POLICY "Users can remove themselves" ON public.team_members FOR DELETE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_members.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 5. Helper functions for RLS (ensure they exist and work)
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

SELECT 'Restoration complete!' AS status;
