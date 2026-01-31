-- Add missing columns to distraction_logs table to support the new Activity Log feature

-- 1. Add 'category' column if it doesn't exist
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS category text;

-- 2. Add 'details' column if it doesn't exist (Critical fix for the reported error)
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS details text;

-- 3. Add 'start_time' column if it doesn't exist
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS start_time timestamptz;

-- 4. Add 'end_time' column if it doesn't exist
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- 5. Add 'duration_minutes' column if it doesn't exist
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Optional: Add comments or default values if needed
-- COMMENT ON COLUMN distraction_logs.category IS 'Category of the activity (distraction, work, dawah, etc)';
