-- Add invoice_id to time_entries to link tracked time with invoices
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'invoice_id') THEN
        ALTER TABLE time_entries ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add default hourly_rate to projects
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'hourly_rate') THEN
        ALTER TABLE projects ADD COLUMN hourly_rate NUMERIC(12,2) DEFAULT 0;
    END IF;
END $$;

-- Update RLS for time_entries to allow project owners to see collaborator's time
-- First, drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;

-- New SELECT policy: Owner of the entry OR owner of the project
CREATE POLICY "View time entries" ON time_entries
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = time_entries.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- UPDATE/DELETE policy remains restrictive to the creator
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
CREATE POLICY "Update own time entries" ON time_entries
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;
CREATE POLICY "Delete own time entries" ON time_entries
FOR DELETE USING (auth.uid() = user_id);

-- INSERT policy: Allow if user is owner OR collaborator
DROP POLICY IF EXISTS "Users can create own time entries" ON time_entries;
CREATE POLICY "Insert time entries" ON time_entries
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
        project_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM project_collaborators pc
            INNER JOIN profiles p ON p.company_email = pc.collaborator_email
            WHERE pc.project_id = time_entries.project_id 
            AND p.id = auth.uid()
            AND pc.status = 'active'
        )
    )
);

-- Re-enable RLS just in case
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
