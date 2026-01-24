-- Add is_bookmarked column to notes_v2
ALTER TABLE public.notes_v2 
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color TEXT; -- Ensuring color column exists as user requested earlier
