-- Migration to add soft delete support for folders and notes

-- Add is_deleted to folders
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='folders' AND column_name='is_deleted') THEN
        ALTER TABLE public.folders ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_deleted to notes_v2
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes_v2' AND column_name='is_deleted') THEN
        ALTER TABLE public.notes_v2 ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
