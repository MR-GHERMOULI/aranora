-- Add contract_data JSONB column to contracts andTemplates
-- This stores structured terms like payment_type, deliverables, etc.

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS contract_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.contract_templates
ADD COLUMN IF NOT EXISTS contract_data JSONB DEFAULT '{}'::jsonb;

-- Optional: Add a comment to describe the contents
COMMENT ON COLUMN public.contracts.contract_data IS 'Structured JSON containing specific contract terms like payment, duration, and scope.';
COMMENT ON COLUMN public.contract_templates.contract_data IS 'Default structured JSON for this template type.';
