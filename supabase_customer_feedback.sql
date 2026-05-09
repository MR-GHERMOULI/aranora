-- ============================================
-- CUSTOMER FEEDBACK TABLE & STORAGE POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  comment TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email column if table already exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_feedback' AND column_name = 'email') THEN
    ALTER TABLE public.customer_feedback ADD COLUMN email TEXT;
  END IF;
END $$;

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
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- STORAGE RLS POLICIES FOR feedback-photos
-- ============================================

-- Allow authenticated users to upload photos
DROP POLICY IF EXISTS "Allow authenticated uploads to feedback-photos" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to feedback-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feedback-photos');

-- Allow public uploads to feedback-photos (if clients aren't logged in)
DROP POLICY IF EXISTS "Allow public uploads to feedback-photos" ON storage.objects;
CREATE POLICY "Allow public uploads to feedback-photos"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'feedback-photos');

-- Allow public viewing of photos
DROP POLICY IF EXISTS "Allow public viewing of feedback-photos" ON storage.objects;
CREATE POLICY "Allow public viewing of feedback-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'feedback-photos');
