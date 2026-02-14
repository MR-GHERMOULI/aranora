-- Project Files table for storing uploaded documents
CREATE TABLE public.project_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own project files" ON public.project_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project files" ON public.project_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files" ON public.project_files
  FOR DELETE USING (auth.uid() = user_id);
