-- ═══════════════════════════════════════════════════════════════════════
-- Security Hardening Part 2: Buckets & Functions
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. Fix "Public Bucket Allows Listing" (4 warnings)
-- Public buckets automatically allow object access without a SELECT policy.
-- Adding a SELECT policy enables the "list" operation, which triggers the warning.
-- Dropping these policies secures the buckets from listing while preserving access.
-- ────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can access specific avatar objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can access specific feedback-photo objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can access specific logo objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access project files" ON storage.objects;

-- ────────────────────────────────────────────────────────────────────────
-- 2. Fix "Public Can Execute SECURITY DEFINER Function" for Triggers
-- Revoking EXECUTE from PUBLIC prevents API access. Triggers ignore these
-- grants, so they will continue to work perfectly in the background.
-- ────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_workspace() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_team_activity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admin_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_intake_submission_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_activity(uuid, text, text, text, uuid, text, jsonb) FROM PUBLIC;

-- ────────────────────────────────────────────────────────────────────────
-- 3. Fix "Signed-In Users Can Execute SECURITY DEFINER Function" for Helpers
-- These helper functions do not cause infinite recursion in RLS, so they
-- can safely be downgraded to SECURITY INVOKER.
-- ────────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.auth_user_company_email() SECURITY INVOKER;
ALTER FUNCTION public.auth_user_is_collaborator(uuid) SECURITY INVOKER;
ALTER FUNCTION public.auth_user_owns_project(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_admin() SECURITY INVOKER;

-- NOTE on `is_team_member` and `is_team_admin`:
-- These two functions MUST remain SECURITY DEFINER to prevent infinite
-- recursion loops in your team_members Row Level Security policies.
-- Supabase officially advises ignoring the warning for RLS helper functions.
