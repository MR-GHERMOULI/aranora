-- ==============================================================================
-- MIGRATION SCRIPT: SHORTEN CONTRACT TOKENS
-- Description: Converts existing long UUID `signing_token` values in the 
-- `contracts` table into shorter, 10-character alphanumeric slugs to match
-- the platform's new, professional link structure.
-- ==============================================================================

DO $$
DECLARE
    contract_record RECORD;
    new_token TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    i INTEGER;
BEGIN
    FOR contract_record IN SELECT id, signing_token FROM public.contracts WHERE signing_token IS NOT NULL LOOP
        -- Skip if it's already a short token (assuming <= 12 chars is a short token)
        IF length(contract_record.signing_token) > 12 THEN
            -- Generate a random 10-character alphanumeric string
            new_token := '';
            FOR i IN 1..10 LOOP
                new_token := new_token || substr(chars, (floor(random() * length(chars)) + 1)::integer, 1);
            END LOOP;

            -- Update the row
            UPDATE public.contracts
            SET signing_token = new_token
            WHERE id = contract_record.id;
        END IF;
    END LOOP;
END $$;
