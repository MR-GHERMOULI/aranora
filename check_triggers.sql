-- Run this in Supabase SQL Editor
SELECT event_object_table AS table_name, trigger_name, event_manipulation AS event, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'users');
