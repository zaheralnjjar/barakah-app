-- ============================================================
-- FIX RLS POLICIES FOR NOTE FOLDERS
-- Created: 2026-01-22
-- Description: إصلاح سياسات الوصول للمجلدات والملاحظات
-- ============================================================

-- ============================================================
-- 1. FIX NOTE_FOLDERS RLS POLICIES
-- ============================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users manage own folders" ON note_folders;

-- Create separate policies for each operation
DROP POLICY IF EXISTS "Users can view own folders" ON note_folders;
CREATE POLICY "Users can view own folders" ON note_folders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own folders" ON note_folders;
CREATE POLICY "Users can insert own folders" ON note_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON note_folders;
CREATE POLICY "Users can update own folders" ON note_folders
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON note_folders;
CREATE POLICY "Users can delete own folders" ON note_folders
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. VERIFY QUICK_NOTES RLS POLICIES
-- ============================================================

-- Check if quick_notes has proper RLS policies
-- If not, create them

DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
    
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view own notes" ON quick_notes;
    DROP POLICY IF EXISTS "Users can insert own notes" ON quick_notes;
    DROP POLICY IF EXISTS "Users can update own notes" ON quick_notes;
    DROP POLICY IF EXISTS "Users can delete own notes" ON quick_notes;
    
    -- Create new policies
    CREATE POLICY "Users can view own notes" ON quick_notes
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own notes" ON quick_notes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own notes" ON quick_notes
        FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own notes" ON quick_notes
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- ============================================================
-- ✅ RLS POLICIES FIXED
-- ============================================================
