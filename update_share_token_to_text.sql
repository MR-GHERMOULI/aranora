-- Convert share_token from UUID to TEXT to allow short custom slugs
ALTER TABLE projects 
ALTER COLUMN share_token TYPE TEXT USING share_token::text;
