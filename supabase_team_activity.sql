-- Create Team Activity table
CREATE TABLE IF NOT EXISTS team_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g. 'INSERT', 'UPDATE', 'DELETE'
    entity_type VARCHAR(100) NOT NULL, -- e.g. 'tasks', 'projects', 'team_members', 'clients'
    entity_id UUID,
    entity_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view team activity" ON team_activity;

-- RLS Policies
CREATE POLICY "Users can view team activity"
    ON team_activity FOR SELECT
    USING (is_team_member(team_id));

-- Add trigger function to auto-log
CREATE OR REPLACE FUNCTION log_team_activity() RETURNS TRIGGER AS $$
DECLARE
  v_team_id UUID;
  v_entity_name TEXT;
BEGIN
  -- Determine team_id and entity_name based on table
  IF TG_TABLE_NAME = 'teams' THEN
    v_team_id := NEW.id;
    v_entity_name := NEW.name;
  ELSIF TG_TABLE_NAME = 'team_members' THEN
    IF TG_OP = 'DELETE' THEN
      v_team_id := OLD.team_id;
      v_entity_name := 'Member Role: ' || OLD.role;
    ELSE
      v_team_id := NEW.team_id;
      v_entity_name := 'Member Role: ' || NEW.role;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_team_id := OLD.team_id;
      IF TG_TABLE_NAME = 'projects' OR TG_TABLE_NAME = 'tasks' THEN
        v_entity_name := OLD.title;
      ELSIF TG_TABLE_NAME = 'clients' THEN
        v_entity_name := OLD.name;
      ELSE
        v_entity_name := OLD.id::text;
      END IF;
    ELSE
      v_team_id := NEW.team_id;
      IF TG_TABLE_NAME = 'projects' OR TG_TABLE_NAME = 'tasks' THEN
        v_entity_name := NEW.title;
      ELSIF TG_TABLE_NAME = 'clients' THEN
        v_entity_name := NEW.name;
      ELSE
        v_entity_name := NEW.id::text;
      END IF;
    END IF;
  END IF;

  -- Only log if we have a team_id and the user is authenticated.
  -- Notice: When Supabase auth creates a user, auth.uid() might be null in some trigger contexts if it's a backend operation.
  -- We'll log it anyway if we have a team_id, but user_id might be null (System).
  IF v_team_id IS NOT NULL THEN
    INSERT INTO team_activity (team_id, user_id, action, entity_type, entity_id, entity_name)
    VALUES (
      v_team_id, 
      auth.uid(), 
      TG_OP, 
      TG_TABLE_NAME, 
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END, 
      v_entity_name
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers (Drop first for idempotency)
DROP TRIGGER IF EXISTS log_tasks_activity ON tasks;
CREATE TRIGGER log_tasks_activity AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION log_team_activity();

DROP TRIGGER IF EXISTS log_projects_activity ON projects;
CREATE TRIGGER log_projects_activity AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION log_team_activity();

DROP TRIGGER IF EXISTS log_clients_activity ON clients;
CREATE TRIGGER log_clients_activity AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION log_team_activity();

DROP TRIGGER IF EXISTS log_team_members_activity ON team_members;
CREATE TRIGGER log_team_members_activity AFTER INSERT OR UPDATE OR DELETE ON team_members FOR EACH ROW EXECUTE FUNCTION log_team_activity();

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_team_activity_team_id ON team_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_created_at ON team_activity(created_at DESC);
