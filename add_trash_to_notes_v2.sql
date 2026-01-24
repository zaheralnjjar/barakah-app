-- Add is_deleted column to notes_v2 for Trash functionality
ALTER TABLE public.notes_v2 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
