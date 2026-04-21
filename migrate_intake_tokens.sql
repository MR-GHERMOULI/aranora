-- ============================================
-- Migrate Intake Form Tokens to Short URLs
-- ============================================

-- 1. Check policies and drop any that have hardcoded UUID matching if applicable
DROP POLICY IF EXISTS "Anyone can view active forms by share token" ON intake_forms;

-- 2. Ensure share_token is TEXT type (it already is TEXT, but this ensures it)
ALTER TABLE intake_forms
ALTER COLUMN share_token TYPE TEXT USING share_token::text;

-- 3. Replace all UUID/hex-format tokens with fresh 10-char short tokens
-- Hex format: 32 chars long, often default from encode(gen_random_bytes(16), 'hex')
-- UUID format: 36 chars long with hyphens
UPDATE intake_forms
SET share_token = (
  SUBSTRING(
    REGEXP_REPLACE(
      ENCODE(gen_random_bytes(10), 'base64'),
      '[^A-Za-z0-9]', '', 'g'
    ),
    1, 10
  )
)
WHERE share_token IS NOT NULL
  AND (LENGTH(share_token) >= 32);

-- 4. Update default value for future insertions
ALTER TABLE intake_forms 
ALTER COLUMN share_token SET DEFAULT 
  SUBSTRING(
    REGEXP_REPLACE(
      ENCODE(gen_random_bytes(10), 'base64'),
      '[^A-Za-z0-9]', '', 'g'
    ),
    1, 10
  );

-- 5. Restore the public access policy
CREATE POLICY "Anyone can view active forms by share token" ON intake_forms
  FOR SELECT USING (share_token IS NOT NULL AND status = 'active');
