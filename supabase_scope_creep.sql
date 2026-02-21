-- Add estimated_hours to tasks to support scope creep detection
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimated_hours') THEN
        ALTER TABLE tasks ADD COLUMN estimated_hours NUMERIC(6,2);
    END IF;
END $$;
