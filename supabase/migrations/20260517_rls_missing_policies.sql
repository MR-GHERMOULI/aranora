-- ═══════════════════════════════════════════════════════════════
-- RLS Policies — Fix for 3 tables with RLS enabled but no policies
-- Tables: promo_invite_links, user_access_logs, user_health_scores
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. promo_invite_links
-- ────────────────────────────────────────────────────────────────
-- Access pattern:
--   READ  → anyone (unauthenticated) can read a promo link by code
--             (the /promo/[code] page uses service role, but the
--              public promo page and signup flow need to look up
--              a code). We restrict reads to active links only for
--              anon users; admin can see everything.
--   WRITE → server-side only (service role bypasses RLS).
--            We add no write policy because all mutations come from
--            the service role client which already bypasses RLS.
--            However we must provide a SELECT policy or the table
--            is inaccessible to the anon/authenticated role entirely.

-- Allow anyone to read active promo links (needed for /promo/[code] page)
CREATE POLICY "Public can view active promo links"
  ON public.promo_invite_links
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated admins full access (for admin dashboard)
CREATE POLICY "Admins have full access to promo links"
  ON public.promo_invite_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );


-- ────────────────────────────────────────────────────────────────
-- 2. user_access_logs
-- ────────────────────────────────────────────────────────────────
-- Access pattern:
--   WRITE → always via service role client (server actions / API
--            routes) — service role bypasses RLS automatically.
--   READ  → admin dashboard only (admin security page).
--
-- Regular users should NEVER be able to read or write access logs
-- through the anon/authenticated Supabase client.

-- Allow admins to read all access logs
CREATE POLICY "Admins can read access logs"
  ON public.user_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated users:
-- all writes go through service role (bypasses RLS).
-- This means regular users cannot insert/read their own logs
-- through the client — intentional for security.


-- ────────────────────────────────────────────────────────────────
-- 3. user_health_scores
-- ────────────────────────────────────────────────────────────────
-- Access pattern:
--   WRITE → always via adminClient (service role) in the
--            /api/admin/health-scores POST route.
--   READ  → admin dashboard only.
--
-- Regular users should not be able to read or manipulate
-- health score snapshots.

-- Allow admins to read all health scores
CREATE POLICY "Admins can read health scores"
  ON public.user_health_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated users:
-- all writes go through service role (bypasses RLS).
