-- Create Time Entries Table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects ON DELETE SET NULL,
    task_id UUID REFERENCES tasks ON DELETE SET NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    is_billable BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);

-- RLS Policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can create own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;

CREATE POLICY "Users can view own time entries" ON time_entries 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time entries" ON time_entries 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries" ON time_entries 
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
CREATE TRIGGER update_time_entries_updated_at 
    BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
