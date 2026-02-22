-- Create Task Comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    activity_type VARCHAR(50) DEFAULT 'comment', -- 'comment', 'status_change', 'assignment_change', etc.
    metadata JSONB DEFAULT '{}'::jsonb, -- Store old/new values, assignment details, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view comments in their teams" ON task_comments;
DROP POLICY IF EXISTS "Users can insert comments in their teams" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;

-- RLS Policies
CREATE POLICY "Users can view comments in their teams"
    ON task_comments FOR SELECT
    USING (is_team_member(team_id));

CREATE POLICY "Users can insert comments in their teams"
    ON task_comments FOR INSERT
    WITH CHECK (is_team_member(team_id));

CREATE POLICY "Users can update their own comments"
    ON task_comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON task_comments FOR DELETE
    USING (user_id = auth.uid() OR is_team_admin(team_id));

-- Add index for efficient querying by task
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_team_id ON task_comments(team_id);
