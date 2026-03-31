-- ============================================
-- CLIENT INTAKE FORMS — نماذج استلام طلبات العملاء
-- ============================================

-- 1. Intake Forms — The form templates created by freelancers
CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  submission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_forms_user_id ON intake_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_share_token ON intake_forms(share_token);
CREATE INDEX IF NOT EXISTS idx_intake_forms_status ON intake_forms(user_id, status);

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Owner policies
DROP POLICY IF EXISTS "Users can view own intake forms" ON intake_forms;
CREATE POLICY "Users can view own intake forms" ON intake_forms
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own intake forms" ON intake_forms;
CREATE POLICY "Users can create own intake forms" ON intake_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own intake forms" ON intake_forms;
CREATE POLICY "Users can update own intake forms" ON intake_forms
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own intake forms" ON intake_forms;
CREATE POLICY "Users can delete own intake forms" ON intake_forms
  FOR DELETE USING (auth.uid() = user_id);

-- Public access: anyone with the share_token can read active forms
DROP POLICY IF EXISTS "Anyone can view active forms by share token" ON intake_forms;
CREATE POLICY "Anyone can view active forms by share token" ON intake_forms
  FOR SELECT USING (share_token IS NOT NULL AND status = 'active');


-- 2. Intake Submissions — Client responses
CREATE TABLE IF NOT EXISTS intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES intake_forms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  responses JSONB DEFAULT '{}'::jsonb NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'converted', 'archived')),
  notes TEXT,
  converted_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  converted_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_form_id ON intake_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_user_id ON intake_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_status ON intake_submissions(user_id, status);

ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;

-- Owner policies (freelancer who owns the form)
DROP POLICY IF EXISTS "Users can view own submissions" ON intake_submissions;
CREATE POLICY "Users can view own submissions" ON intake_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own submissions" ON intake_submissions;
CREATE POLICY "Users can update own submissions" ON intake_submissions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own submissions" ON intake_submissions;
CREATE POLICY "Users can delete own submissions" ON intake_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Public: anyone can submit (insert) a submission
DROP POLICY IF EXISTS "Anyone can submit intake forms" ON intake_submissions;
CREATE POLICY "Anyone can submit intake forms" ON intake_submissions
  FOR INSERT WITH CHECK (true);


-- 3. Triggers for updated_at
DROP TRIGGER IF EXISTS update_intake_forms_updated_at ON intake_forms;
CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Function to auto-increment submission_count
CREATE OR REPLACE FUNCTION increment_intake_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE intake_forms
  SET submission_count = submission_count + 1
  WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_intake_submission_created ON intake_submissions;
CREATE TRIGGER on_intake_submission_created
  AFTER INSERT ON intake_submissions
  FOR EACH ROW EXECUTE FUNCTION increment_intake_submission_count();


-- 5. Storage bucket for intake form attachments
-- Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('intake-attachments', 'intake-attachments', true);
