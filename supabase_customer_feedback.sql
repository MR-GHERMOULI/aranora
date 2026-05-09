-- ============================================
-- CUSTOMER FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_feedback_project ON public.customer_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_read ON public.customer_feedback(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_created ON public.customer_feedback(created_at DESC);

-- RLS
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert feedback" ON public.customer_feedback;
CREATE POLICY "Allow public insert feedback"
  ON public.customer_feedback
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin full access feedback" ON public.customer_feedback;
CREATE POLICY "Allow admin full access feedback"
  ON public.customer_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

GRANT ALL ON public.customer_feedback TO authenticated;
GRANT INSERT ON public.customer_feedback TO anon;
