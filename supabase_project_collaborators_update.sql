-- Update project_collaborators table to support different pricing models
ALTER TABLE project_collaborators 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'revenue_share' CHECK (payment_type IN ('revenue_share', 'hourly'));

-- Update existing records to have 'revenue_share' as default payment type
UPDATE project_collaborators 
SET payment_type = 'revenue_share' 
WHERE payment_type IS NULL;
