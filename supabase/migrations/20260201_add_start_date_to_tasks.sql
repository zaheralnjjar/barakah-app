-- Add start_date column to tasks table if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
