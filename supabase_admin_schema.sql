-- ============================================
-- Aranora Admin Dashboard Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add admin-related columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE profiles ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Static Pages Table (for About, Privacy, Terms, FAQ, Contact)
CREATE TABLE IF NOT EXISTS static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  content TEXT,
  content_ar TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pages if not exists
INSERT INTO static_pages (slug, title, title_ar, content, content_ar) VALUES
  ('about', 'About Us', 'من نحن', '<h2>Welcome to Aranora</h2><p>Your professional freelance management platform.</p>', '<h2>مرحباً بك في أرانورا</h2><p>منصتك الاحترافية لإدارة العمل الحر.</p>'),
  ('privacy', 'Privacy Policy', 'سياسة الخصوصية', '<h2>Privacy Policy</h2><p>Your privacy is important to us.</p>', '<h2>سياسة الخصوصية</h2><p>خصوصيتك مهمة بالنسبة لنا.</p>'),
  ('terms', 'Terms of Service', 'شروط الخدمة', '<h2>Terms of Service</h2><p>Please read these terms carefully.</p>', '<h2>شروط الخدمة</h2><p>يرجى قراءة هذه الشروط بعناية.</p>'),
  ('faq', 'FAQ', 'الأسئلة الشائعة', '<h2>Frequently Asked Questions</h2>', '<h2>الأسئلة الشائعة</h2>'),
  ('contact', 'Contact Us', 'اتصل بنا', '<h2>Get in Touch</h2>', '<h2>تواصل معنا</h2>')
ON CONFLICT (slug) DO NOTHING;

-- 3. Page Revisions Table (for version history)
CREATE TABLE IF NOT EXISTS page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES static_pages ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  edited_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_revisions_page ON page_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_created ON page_revisions(created_at DESC);

-- 4. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES auth.users ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('branding', '{"logo_url": null, "primary_color": "#1E3A5F", "secondary_color": "#4ADE80", "font_family": "Inter"}'::jsonb, 'Platform branding settings'),
  ('features', '{"contracts_enabled": true, "partnerships_enabled": true, "team_enabled": true}'::jsonb, 'Feature toggles'),
  ('limits', '{"max_clients_per_user": null, "max_projects_per_user": null}'::jsonb, 'Usage limits (null = unlimited)'),
  ('notifications', '{"notify_new_user": true, "notify_new_project": false}'::jsonb, 'Admin notification preferences')
ON CONFLICT (key) DO NOTHING;

-- 5. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('user', 'page', 'setting', 'system')),
  target_id UUID,
  target_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(action_type);

-- 6. Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_user', 'new_project', 'new_invoice', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notifications' AND column_name = 'is_read') THEN
    ALTER TABLE admin_notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_static_pages_updated_at ON static_pages;
CREATE TRIGGER update_static_pages_updated_at BEFORE UPDATE ON static_pages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_admin_email TEXT,
  p_action TEXT,
  p_action_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (admin_id, admin_email, action, action_type, target_id, target_name, metadata)
  VALUES (p_admin_id, p_admin_email, p_action, p_action_type, p_target_id, p_target_name, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to create admin notification on new user
CREATE OR REPLACE FUNCTION notify_admin_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, metadata)
  VALUES (
    'new_user',
    'New User Registered',
    'A new user has registered: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_notify_admin ON auth.users;
CREATE TRIGGER on_new_user_notify_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION notify_admin_new_user();

-- 10. RLS Policies for admin tables (no RLS - admin only access via service role)
-- These tables are accessed via server-side API routes with admin verification

-- Grant permissions (for service role)
GRANT ALL ON static_pages TO authenticated;
GRANT ALL ON page_revisions TO authenticated;
GRANT ALL ON platform_settings TO authenticated;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON admin_notifications TO authenticated;

-- 11. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (for idempotency)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_messages' AND column_name = 'is_read') THEN
    ALTER TABLE contact_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

-- Grant permissions
GRANT ALL ON contact_messages TO authenticated;
GRANT INSERT ON contact_messages TO anon; -- Allow public to insert messages via API/RPC if needed, or stick to service role in API route

-- 12. Broadcasts Table (History)
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  sent_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. User Notifications Table (Extension of existing table)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
    ALTER TABLE notifications ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message') THEN
    ALTER TABLE notifications ADD COLUMN message TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link') THEN
    ALTER TABLE notifications ADD COLUMN link TEXT;
  END IF;
  -- Support both 'read' (existing) and 'is_read' (new preference) via generated column or just use 'read'
  -- We'll stick to 'read' for compatibility but ensure it exists
END $$;

-- Drop indices to re-create safely
DROP INDEX IF EXISTS idx_notifications_user_id;
-- Ensure indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- Check if read or is_read exists for index
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read);

-- Grant permissions
GRANT ALL ON broadcasts TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- ============================================
-- IMPORTANT: After running this script, manually set your admin user:
-- UPDATE profiles SET is_admin = TRUE WHERE id = '<your-user-id>';
-- ============================================
