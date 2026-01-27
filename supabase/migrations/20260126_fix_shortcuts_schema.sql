-- Migration: Fix Shortcut Tables Schema
-- Date: 2026-01-26

-- 1. Ensure 'slot' column exists in favorite_contacts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorite_contacts' AND column_name = 'slot') THEN
        ALTER TABLE favorite_contacts ADD COLUMN slot INTEGER CHECK (slot IN (1, 2));
        ALTER TABLE favorite_contacts ADD CONSTRAINT favorite_contacts_user_slot_key UNIQUE (user_id, slot);
    END IF;
END $$;

-- 2. Ensure distraction_logs exists (failsafe)
CREATE TABLE IF NOT EXISTS distraction_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    task_id TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for distraction_logs
ALTER TABLE distraction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own distraction logs" ON distraction_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
