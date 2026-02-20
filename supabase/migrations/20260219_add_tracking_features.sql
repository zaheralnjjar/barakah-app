-- Add 'data' column to tracker_entries to support complex types (json)
ALTER TABLE tracker_entries 
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN tracker_entries.data IS 'Stores additional data for the entry, e.g., selected options, text notes, etc.';
