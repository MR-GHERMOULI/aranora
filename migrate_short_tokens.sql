-- Migrate existing UUID-format share_tokens to short 10-character alphanumeric tokens
-- This replaces any share_token that looks like a UUID (contains hyphens and is 36 chars)
-- with a newly generated short token using the same charset as the app.

-- Enable pgcrypto if not already enabled (needed for gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Replace all UUID-format tokens with fresh short tokens
-- UUID format: 8-4-4-4-12 hex chars separated by hyphens = 36 chars
UPDATE projects
SET share_token = (
  -- Generate a 10-character alphanumeric token using encode + trim
  -- We take a 7-byte random blob, base64-encode it (gives ~10 alphanum chars),
  -- strip non-alphanumeric chars, and take the first 10 characters.
  SUBSTRING(
    REGEXP_REPLACE(
      ENCODE(gen_random_bytes(10), 'base64'),
      '[^A-Za-z0-9]', '', 'g'
    ),
    1, 10
  )
)
WHERE share_token IS NOT NULL
  AND share_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Verify: show all current share_tokens after migration
SELECT id, title, share_token, LENGTH(share_token) AS token_length
FROM projects
WHERE share_token IS NOT NULL
ORDER BY created_at DESC;
