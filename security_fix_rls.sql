-- ============================================
-- ARANORA SECURITY FIX: Enable RLS, Policies & Search Paths
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. SECURITY FUNCTIONS (Fix Search Path Warnings)
-- These updates prevent "search path hijacking" by pinning functions to the public schema.

-- [is_admin]
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [slugify]
CREATE OR REPLACE FUNCTION public.slugify(text_to_slugify TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(text_to_slugify);
  slug := regexp_replace(slug, '[^a-z0-9\u0621-\u064A]+', '-', 'g');
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  RETURN slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [update_updated_at_column]
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [log_admin_activity]
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_id UUID, p_admin_email TEXT, p_action TEXT, p_action_type TEXT,
  p_target_id UUID DEFAULT NULL, p_target_name TEXT DEFAULT NULL, p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (admin_id, admin_email, action, action_type, target_id, target_name, metadata)
  VALUES (p_admin_id, p_admin_email, p_action, p_action_type, p_target_id, p_target_name, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [notify_admin_new_user]
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'new_user',
    'New User Registered',
    'A new user has registered: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [handle_new_user]
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE base_username TEXT; final_username TEXT;
BEGIN
  base_username := SPLIT_PART(NEW.email, '@', 1); final_username := base_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN final_username := base_username || '_' || SUBSTRING(gen_random_uuid()::text, 1, 4); END IF;
  INSERT INTO public.profiles (id, username, full_name, phone, country, company_email)
  VALUES (NEW.id, LOWER(final_username), NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'country', NEW.email);
  RETURN NEW;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Enable RLS and set policies

-- Static Pages (Public read, Admin write)
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for published pages" ON public.static_pages;
DROP POLICY IF EXISTS "Allow admin full access" ON public.static_pages;
CREATE POLICY "Allow public read for published pages" ON public.static_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Allow admin full access" ON public.static_pages FOR ALL TO authenticated USING (is_admin());

-- Page Revisions (Admin only)
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.page_revisions;
CREATE POLICY "Allow admin full access" ON public.page_revisions FOR ALL TO authenticated USING (is_admin());

-- Platform Settings (Admin only)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.platform_settings;
CREATE POLICY "Allow admin full access" ON public.platform_settings FOR ALL TO authenticated USING (is_admin());

-- Activity Logs (Admin only)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.activity_logs;
CREATE POLICY "Allow admin full access" ON public.activity_logs FOR ALL TO authenticated USING (is_admin());

-- Admin Notifications (Admin only)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.admin_notifications;
CREATE POLICY "Allow admin full access" ON public.admin_notifications FOR ALL TO authenticated USING (is_admin());

-- Contact Messages (Anon insert, Admin full)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin full access" ON public.contact_messages;
CREATE POLICY "Allow public insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON public.contact_messages FOR ALL TO authenticated USING (is_admin());

-- Broadcasts (Admin only)
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.broadcasts;
CREATE POLICY "Allow admin full access" ON public.broadcasts FOR ALL TO authenticated USING (is_admin());

-- Notifications (User isolation, Admin full)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admin full access" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow admin full access" ON public.notifications FOR ALL TO authenticated USING (is_admin());

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- 1. Check RLS:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' 
-- AND tablename IN ('static_pages', 'page_revisions', 'platform_settings', 'activity_logs', 'admin_notifications', 'contact_messages', 'broadcasts', 'notifications');

-- 2. Check Search Path:
-- SELECT routine_name, config_options FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name IN ('is_admin', 'slugify', 'update_updated_at_column', 'log_admin_activity', 'notify_admin_new_user', 'handle_new_user');
