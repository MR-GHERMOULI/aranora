-- ============================================
-- Aranora Admin Settings - Testimonials & Platform Links
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  service TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  display_location TEXT DEFAULT 'all', -- 'home', 'projects', etc.
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_location ON testimonials(display_location);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 2. Platform Links Table
CREATE TABLE IF NOT EXISTS platform_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_links_active ON platform_links(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_links_order ON platform_links(display_order);

-- Enable RLS
ALTER TABLE platform_links ENABLE ROW LEVEL SECURITY;

-- 3. Footer Links Table
CREATE TABLE IF NOT EXISTS footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_footer_links_active ON footer_links(is_active);
CREATE INDEX IF NOT EXISTS idx_footer_links_order ON footer_links(display_order);

-- Enable RLS
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

-- 4. Permissions (Granting all to authenticated users, since access is controlled via server-side admin check)
GRANT ALL ON testimonials TO authenticated;
GRANT ALL ON platform_links TO authenticated;
GRANT ALL ON footer_links TO authenticated;

-- 5. Updated_at Trigger
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_links_updated_at ON platform_links;
CREATE TRIGGER update_platform_links_updated_at BEFORE UPDATE ON platform_links 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_footer_links_updated_at ON footer_links;
CREATE TRIGGER update_footer_links_updated_at BEFORE UPDATE ON footer_links 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
