-- Add styling columns to quick_notes table
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inherit',
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS is_bold boolean DEFAULT false;

-- Enhance CreateNoteDialog query will need to select these.
-- Existing select * will cover it.
