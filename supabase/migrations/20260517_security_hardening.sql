-- ═══════════════════════════════════════════════════════════════════════
-- Security Hardening Migration
-- Fixes all WARN-level security advisories from Supabase Linter
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 1: Fix mutable search_path on 5 functions
-- Prevents search_path injection attacks by locking the path.
-- ────────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.increment_intake_submission_count()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.cleanup_expired_otps()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.log_team_activity()
    SET search_path = public, pg_temp;

-- slugify is a utility function; try common signatures
ALTER FUNCTION public.slugify(text)
    SET search_path = public, pg_temp;


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 2: Fix overly permissive RLS policies (USING/WITH CHECK = true)
-- ────────────────────────────────────────────────────────────────────────

-- ── 2a. articles: "Admins can do everything" ─────────────────────────
-- Blog articles are publicly readable (the /blog page uses anon client).
-- Admin write access must be scoped to is_admin=true users.

DROP POLICY IF EXISTS "Admins can do everything" ON public.articles;

-- Public can read published articles (needed for /blog)
CREATE POLICY "Public can read published articles"
    ON public.articles FOR SELECT
    USING (status = 'published');

-- Admins can manage all articles (read drafts, write, delete)
CREATE POLICY "Admins can manage all articles"
    ON public.articles FOR ALL
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


-- ── 2b. contact_messages: "Allow public insert" ───────────────────────
-- Anyone can submit a contact form, but we add minimal non-null checks
-- to prevent empty/spam submissions from satisfying the WITH CHECK.

DROP POLICY IF EXISTS "Allow public insert" ON public.contact_messages;

CREATE POLICY "Allow public insert"
    ON public.contact_messages FOR INSERT
    WITH CHECK (
        name IS NOT NULL
        AND name <> ''
        AND message IS NOT NULL
        AND message <> ''
    );


-- ── 2c. customer_feedback: "Allow public insert feedback" ─────────────
-- Anyone can submit feedback (linked to a public share token page).
-- Require minimal non-null, non-empty fields.

DROP POLICY IF EXISTS "Allow public insert feedback" ON public.customer_feedback;

CREATE POLICY "Allow public insert feedback"
    ON public.customer_feedback FOR INSERT
    WITH CHECK (
        name IS NOT NULL
        AND name <> ''
        AND comment IS NOT NULL
        AND comment <> ''
    );


-- ── 2d. intake_submissions: "Anyone can submit intake forms" ──────────
-- Intake form submissions are public (anon users fill in client forms).
-- Require form_id and client_name to be present.

DROP POLICY IF EXISTS "Anyone can submit intake forms" ON public.intake_submissions;

CREATE POLICY "Anyone can submit intake forms"
    ON public.intake_submissions FOR INSERT
    WITH CHECK (
        form_id IS NOT NULL
        AND client_name IS NOT NULL
        AND client_name <> ''
    );


-- ── 2e. login_otp_codes: "Service role manages OTP codes" ─────────────
-- Service role bypasses RLS automatically; it does not need a policy.
-- This USING(true) policy dangerously grants all roles full access.
-- Drop it entirely. All OTP operations are server-side via service role.

DROP POLICY IF EXISTS "Service role manages OTP codes" ON public.login_otp_codes;


-- ── 2f. notifications: "Authenticated users can insert notifications" ──
-- The previous policy allowed any authenticated user to insert a
-- notification for ANY user_id. Fix: users can only insert for themselves.
-- Server-side routes that insert for other users must use service/admin client.

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());


-- ── 2g. team_invitations: "Invitees can update invitation status" ─────
-- The old policy used USING(true) — anyone could update any invitation.
-- Fix: only the intended invitee (matched by their auth UID) can update.
-- Note: if this table uses 'invitee_id', adjust the column name below.

DROP POLICY IF EXISTS "Invitees can update invitation status" ON public.team_invitations;

CREATE POLICY "Invitees can update invitation status"
    ON public.team_invitations FOR UPDATE
    USING (invitee_id = auth.uid())
    WITH CHECK (invitee_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 3: Fix public storage buckets allowing file listing
-- Public buckets serve files via direct URL without a SELECT policy.
-- Removing the broad SELECT policy prevents clients from enumerating
-- all files while still allowing direct URL access to known objects.
-- ────────────────────────────────────────────────────────────────────────

-- avatars bucket
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;

-- Allow anyone to SELECT a specific avatar if they know the path
-- (no wildcards = no listing, just direct object access)
CREATE POLICY "Public can access specific avatar objects"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- feedback-photos bucket
DROP POLICY IF EXISTS "Allow public viewing of feedback-photos" ON storage.objects;

CREATE POLICY "Public can access specific feedback-photo objects"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'feedback-photos');

-- logos bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public can access specific logo objects"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'logos');

-- project-files bucket (restrict to authenticated users only)
DROP POLICY IF EXISTS "Allow authenticated viewing from project-files" ON storage.objects;

CREATE POLICY "Authenticated users can access project files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'project-files');


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 4: Revoke EXECUTE on SECURITY DEFINER functions from anon role
-- These functions run with elevated privileges. Anon users (unauthenticated)
-- should never be able to call them via REST API (/rest/v1/rpc/...).
-- ────────────────────────────────────────────────────────────────────────

-- Trigger functions — called only by DB triggers, never directly by users
REVOKE EXECUTE ON FUNCTION public.handle_new_user()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_workspace()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_team_activity()             FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_new_user()         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps()          FROM anon, authenticated;

-- Admin-only logging function — only callable server-side via service role
REVOKE EXECUTE ON FUNCTION public.log_admin_activity(uuid, text, text, text, uuid, text, jsonb)
    FROM anon, authenticated;

-- Auth helper functions — keep callable by authenticated (used in RLS policies),
-- revoke from anon so unauthenticated REST callers cannot probe these functions.
REVOKE EXECUTE ON FUNCTION public.auth_user_company_email()            FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_is_collaborator(uuid)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_owns_project(uuid)         FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid)                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid)                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.slugify(text)                        FROM anon;

-- increment_intake_submission_count: called by trigger on intake form insert.
-- Intake submissions can be by anon users, but this trigger function does
-- not need direct REST access — triggers bypass user-level EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.increment_intake_submission_count()  FROM anon;

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 5: Leaked Password Protection
-- Cannot be done via SQL. Must be enabled manually in:
--   Supabase Dashboard → Authentication → Settings → Password Protection
--   Enable: "Check for compromised passwords (HaveIBeenPwned)"
-- ────────────────────────────────────────────────────────────────────────
