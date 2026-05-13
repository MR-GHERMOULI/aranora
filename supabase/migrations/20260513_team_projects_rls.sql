-- ═══════════════════════════════════════════════
-- Team Members Projects RLS Policies
-- ═══════════════════════════════════════════════

-- Allow team members to view projects they are assigned to
CREATE POLICY "Team members can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_member_projects tmp
      JOIN team_members tm ON tm.id = tmp.team_member_id
      WHERE tmp.project_id = projects.id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tmp.removed_at IS NULL
    )
  );

-- Also allow team members to view tasks for projects they are assigned to
CREATE POLICY "Team members can view tasks of assigned projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_member_projects tmp
      JOIN team_members tm ON tm.id = tmp.team_member_id
      WHERE tmp.project_id = tasks.project_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tmp.removed_at IS NULL
    )
  );

-- And time entries
CREATE POLICY "Team members can view time entries of assigned projects"
  ON time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_member_projects tmp
      JOIN team_members tm ON tm.id = tmp.team_member_id
      WHERE tmp.project_id = time_entries.project_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tmp.removed_at IS NULL
    )
  );
