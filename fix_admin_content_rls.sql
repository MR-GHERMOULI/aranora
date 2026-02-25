-- ============================================
-- FIX: Missing RLS Policies for Admin Content Tables
-- (testimonials, platform_links, footer_links)
-- 
-- These tables had RLS enabled but NO policies created,
-- causing 403 Forbidden errors on all operations.
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1. TESTIMONIALS - Public read (for homepage display), Admin write
DROP POLICY IF EXISTS "Allow public read active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow admin full access" ON public.testimonials;

CREATE POLICY "Allow public read active testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access" ON public.testimonials
  FOR ALL TO authenticated USING (public.is_admin());

-- 2. PLATFORM LINKS - Public read (for homepage/footer display), Admin write
DROP POLICY IF EXISTS "Allow public read active platform links" ON public.platform_links;
DROP POLICY IF EXISTS "Allow admin full access" ON public.platform_links;

CREATE POLICY "Allow public read active platform links" ON public.platform_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access" ON public.platform_links
  FOR ALL TO authenticated USING (public.is_admin());

-- 3. FOOTER LINKS - Public read (for site footer display), Admin write
DROP POLICY IF EXISTS "Allow public read active footer links" ON public.footer_links;
DROP POLICY IF EXISTS "Allow admin full access" ON public.footer_links;

CREATE POLICY "Allow public read active footer links" ON public.footer_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access" ON public.footer_links
  FOR ALL TO authenticated USING (public.is_admin());

-- ============================================
-- VERIFICATION: Run this to confirm policies are in place
-- ============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('testimonials', 'platform_links', 'footer_links');
