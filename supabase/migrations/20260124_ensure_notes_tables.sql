-- ============================================================
-- ENSURE NOTES TABLES EXIST
-- Created: 2026-01-24
-- Description: Creates note_folders and quick_notes if they don't exist
-- ============================================================

-- 1. Note Folders
CREATE TABLE IF NOT EXISTS note_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4ade80',
    icon TEXT DEFAULT 'folder',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own folders" ON note_folders;
    CREATE POLICY "Users can manage their own folders" ON note_folders
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Quick Notes
CREATE TABLE IF NOT EXISTS quick_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'ملاحظة',
    content TEXT,
    color TEXT DEFAULT '#ffffff',
    folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_secure BOOLEAN DEFAULT FALSE,
    lock_pin TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validate constraints and columns might be missing if table existed but was old
DO $$ 
BEGIN
    -- Add folder_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quick_notes' AND column_name = 'folder_id') THEN
        ALTER TABLE quick_notes ADD COLUMN folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL;
    END IF;

    -- Add is_secure if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quick_notes' AND column_name = 'is_secure') THEN
        ALTER TABLE quick_notes ADD COLUMN is_secure BOOLEAN DEFAULT FALSE;
    END IF;

     -- Add lock_pin if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quick_notes' AND column_name = 'lock_pin') THEN
        ALTER TABLE quick_notes ADD COLUMN lock_pin TEXT;
    END IF;
END $$;

ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own notes" ON quick_notes;
    CREATE POLICY "Users can manage their own notes" ON quick_notes
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable Realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE note_folders;
    ALTER PUBLICATION supabase_realtime ADD TABLE quick_notes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
