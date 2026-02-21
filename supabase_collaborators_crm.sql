-- Create Collaborators CRM table
CREATE TABLE IF NOT EXISTS collaborators_crm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    platform_profile_link TEXT,
    country TEXT,
    date_of_birth DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE collaborators_crm ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own collaborator directory" ON collaborators_crm
    FOR ALL USING (auth.uid() = user_id);

-- Create Payments table for collaborators
CREATE TABLE IF NOT EXISTS collaborator_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES collaborators_crm(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE collaborator_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own collaborator payments" ON collaborator_payments
    FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger for crm table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collaborators_crm_updated_at
    BEFORE UPDATE ON collaborators_crm
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
