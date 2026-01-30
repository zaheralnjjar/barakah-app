-- Add text_align column to quick_notes table
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS text_align text DEFAULT 'right';
