-- ============================================================
-- MISSING CORE TABLES MIGRATION (FIXED & ROBUST)
-- Created: 2026-01-23
-- Description: Creates 6 missing tables and ensures user_id exists
-- ============================================================

-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

-- Ensure columns exist (Idempotent)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT; -- Make nullable initially to avoid errors on existing rows
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'task';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_appointment_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_preparatory_for TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_before_appointment INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 2. SHOPPING ITEMS TABLE
CREATE TABLE IF NOT EXISTS shopping_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unit';
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own shopping list" ON shopping_items;
CREATE POLICY "Users can manage their own shopping list" ON shopping_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS medications (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

ALTER TABLE medications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS custom_days TEXT[];
ALTER TABLE medications ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT TRUE;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own medications" ON medications;
CREATE POLICY "Users can manage their own medications" ON medications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. MEDICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS medication_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS medication_id UUID REFERENCES medications(id) ON DELETE CASCADE;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS taken BOOLEAN DEFAULT TRUE;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ DEFAULT NOW();

-- Handle UNIQUE constraint safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_logs_medication_id_date_key') THEN
        ALTER TABLE medication_logs ADD CONSTRAINT medication_logs_medication_id_date_key UNIQUE(medication_id, date);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own medication logs" ON medication_logs;
CREATE POLICY "Users can manage their own medication logs" ON medication_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. SAVED LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS saved_locations (id TEXT PRIMARY KEY);

ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'location';
ALTER TABLE saved_locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own locations" ON saved_locations;
CREATE POLICY "Users can manage their own locations" ON saved_locations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. HIDAYA NOTES TABLE
CREATE TABLE IF NOT EXISTS hidaya_notes (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'quick';
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS is_secure BOOLEAN DEFAULT FALSE;
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE hidaya_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE hidaya_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own hidaya notes" ON hidaya_notes;
CREATE POLICY "Users can manage their own hidaya notes" ON hidaya_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ENABLE REALTIME
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE medications;
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE saved_locations;
    ALTER PUBLICATION supabase_realtime ADD TABLE hidaya_notes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
