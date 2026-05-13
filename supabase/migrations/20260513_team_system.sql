-- ═══════════════════════════════════════════════
-- Team Management System Migration
-- ═══════════════════════════════════════════════

-- 1. Extend team_members table with roles, salary, and invite system
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
    CHECK (role IN ('owner', 'manager', 'member')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'suspended')),
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS salary_notes TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- 2. Junction table: which team members are assigned to which projects
CREATE TABLE IF NOT EXISTS team_member_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(team_member_id, project_id)
);

-- 3. Add account_type and active_team_id to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'freelancer'
    CHECK (account_type IN ('freelancer', 'team_member', 'affiliate')),
  ADD COLUMN IF NOT EXISTS active_team_id UUID;

-- 4. RLS for team_member_projects
ALTER TABLE team_member_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage assignments"
  ON team_member_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_projects.team_member_id
        AND tm.team_id IN (
          SELECT tm2.team_id FROM team_members tm2
          WHERE tm2.user_id = auth.uid() AND tm2.role = 'owner'
        )
    )
  );

CREATE POLICY "Members can view their own assignments"
  ON team_member_projects FOR SELECT
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_team_member_projects_member ON team_member_projects(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_projects_project ON team_member_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_invite_token ON team_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_profiles_active_team ON profiles(active_team_id);
