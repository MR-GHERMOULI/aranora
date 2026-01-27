-- ============================================
-- Add slug column to projects table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add slug column if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create a function to slugify text (handles basic latin and arabic characters)
CREATE OR REPLACE FUNCTION slugify(text_to_slugify TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  slug := lower(text_to_slugify);
  slug := regexp_replace(slug, '[^a-z0-9\u0621-\u064A]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing slugs
UPDATE public.projects 
SET slug = slugify(title)
WHERE slug IS NULL;

-- 4. Make it NOT NULL for future entries (optional, but recommended)
-- ALTER TABLE public.projects ALTER COLUMN slug SET NOT NULL;

-- 5. Add an index for faster lookups (though we usually query by ID)
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
