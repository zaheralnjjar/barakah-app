-- Migration: Add Google Tasks Sync Columns
-- Created: 2026-02-02

-- Update Tasks Table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_task_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_list_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Update Shopping Items Table
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS google_task_id TEXT;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS google_list_id TEXT;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Enable Realtime for these tables (if not already enabled)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
