-- 1. Add bucket column to quick_notes table
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS bucket text DEFAULT 'inbox';

-- 2. Populate bucket column for existing notes (Default to 'inbox')
UPDATE quick_notes SET bucket = 'inbox' WHERE bucket IS NULL;

-- 3. (Optional) You can try to map existing folders to buckets if you want, 
-- but since we are doing a "Clean Slate", 'inbox' is safer.

-- 4. Drop the problematic note_folders table
-- We rename it first just in case you want to backup data manually later
ALTER TABLE note_folders RENAME TO note_folders_backup;
-- DROP TABLE note_folders; -- Uncomment this line to actually delete it
