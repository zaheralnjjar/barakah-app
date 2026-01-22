-- ============================================================
-- ADVANCED NOTES SYSTEM - COMPLETE MIGRATION
-- Created: 2026-01-22
-- Description: نظام ملاحظات متطور مع مجلدات وسجل تعديلات
-- SAFE TO RUN: Drops and recreates tables
-- ============================================================

-- ============================================================
-- 0. CLEANUP EXISTING TABLES (if any)
-- ============================================================
DROP TABLE IF EXISTS note_folders CASCADE;
DROP TABLE IF EXISTS note_revisions CASCADE;

-- ============================================================
-- 1. CREATE NOTE FOLDERS TABLE
-- ============================================================
CREATE TABLE note_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4ade80',
    icon TEXT DEFAULT 'folder',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_note_folders_user ON note_folders(user_id);
CREATE INDEX idx_note_folders_order ON note_folders(order_index);

-- Enable RLS
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own folders" ON note_folders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. UPDATE QUICK_NOTES TABLE
-- ============================================================

-- Add new columns (using IF NOT EXISTS for safety)
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS lock_pin TEXT;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Clean up orphaned folder_id references (set to NULL if folder doesn't exist)
UPDATE quick_notes 
SET folder_id = NULL 
WHERE folder_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM note_folders WHERE id = quick_notes.folder_id);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- First, drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quick_notes_folder_id_fkey'
    ) THEN
        ALTER TABLE quick_notes DROP CONSTRAINT quick_notes_folder_id_fkey;
    END IF;
    
    -- Now add it fresh
    ALTER TABLE quick_notes 
    ADD CONSTRAINT quick_notes_folder_id_fkey 
    FOREIGN KEY (folder_id) REFERENCES note_folders(id) ON DELETE SET NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quick_notes_folder ON quick_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_pinned ON quick_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_quick_notes_tags ON quick_notes USING GIN(tags);

-- ============================================================
-- 3. CREATE NOTE REVISIONS TABLE
-- ============================================================
CREATE TABLE note_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES quick_notes(id) ON DELETE CASCADE,
    revision_title TEXT NOT NULL,
    content TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    color_code TEXT NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_note_revisions_note ON note_revisions(note_id);
CREATE INDEX idx_note_revisions_created ON note_revisions(created_at DESC);
CREATE INDEX idx_note_revisions_number ON note_revisions(revision_number);

-- Enable RLS
ALTER TABLE note_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own note revisions" ON note_revisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quick_notes 
            WHERE quick_notes.id = note_revisions.note_id 
            AND quick_notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own note revisions" ON note_revisions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quick_notes 
            WHERE quick_notes.id = note_revisions.note_id 
            AND quick_notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users delete own note revisions" ON note_revisions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM quick_notes 
            WHERE quick_notes.id = note_revisions.note_id 
            AND quick_notes.user_id = auth.uid()
        )
    );

-- ============================================================
-- 4. CREATE TRIGGERS
-- ============================================================

-- Trigger function for note_folders updated_at
CREATE OR REPLACE FUNCTION update_note_folders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_note_folders_updated
    BEFORE UPDATE ON note_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_note_folders_timestamp();

-- ============================================================
-- 5. ENABLE REALTIME
-- ============================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE note_folders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE note_revisions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 6. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON note_folders TO authenticated;
GRANT ALL ON note_revisions TO authenticated;

-- ============================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================
-- Tables created:
-- - note_folders (with order_index column)
-- - note_revisions (for revision history)
-- 
-- Tables updated:
-- - quick_notes (added 6 new columns)
-- ============================================================
