-- Add color column to quick_notes table if it doesn't exist
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FFFFFF';
