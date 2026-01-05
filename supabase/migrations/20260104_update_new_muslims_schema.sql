-- Add missing columns to new_muslims table
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS custom_protocol JSONB DEFAULT NULL;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '{}'::jsonb;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS witness_sheikh TEXT;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS available_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS birth_date DATE;
-- Ensure other columns exist (idempotent)
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE new_muslims ADD COLUMN IF NOT EXISTS address TEXT;

-- Enable Realtime
alter publication supabase_realtime add table new_muslims;
