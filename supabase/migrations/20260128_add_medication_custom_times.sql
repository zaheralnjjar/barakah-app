-- Add custom_times column to medications table
ALTER TABLE medications ADD COLUMN IF NOT EXISTS custom_times JSONB DEFAULT '{}'::jsonb;
