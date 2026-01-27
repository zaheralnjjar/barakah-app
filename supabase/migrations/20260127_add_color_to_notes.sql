-- Add color column to quick_notes table
ALTER TABLE IF EXISTS quick_notes 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#ffffff';

-- Ensure RLS allows access (usually policies cover 'all columns', but good to double check context via comment)
-- This assumes existing RLS policies cover the new column automatically.

-- Update existing records to have a default color if needed (already handled by DEFAULT)
UPDATE quick_notes SET color = '#ffffff' WHERE color IS NULL;
