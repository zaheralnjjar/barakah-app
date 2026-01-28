-- Add is_system column to note_folders
ALTER TABLE note_folders ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Create 'General' folder for existing users if not exists, or mark existing one as system
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Check if 'عام' folder exists for this user
        IF EXISTS (SELECT 1 FROM note_folders WHERE user_id = user_record.id AND name = 'عام') THEN
            UPDATE note_folders SET is_system = TRUE WHERE user_id = user_record.id AND name = 'عام';
        ELSE
            -- Insert new General folder
            INSERT INTO note_folders (name, icon, color, user_id, is_system)
            VALUES ('عام', '📁', '#3B82F6', user_record.id, TRUE);
        END IF;
    END LOOP;
END $$;
