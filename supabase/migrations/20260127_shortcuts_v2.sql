-- Migration: Enhanced Shortcuts System V2
-- Date: 2026-01-27
-- Description: Add folder support, presets (saved configurations), and location shortcuts

-- 1. Update custom_shortcuts table to support folders
ALTER TABLE custom_shortcuts 
ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES custom_shortcuts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS folder_color TEXT DEFAULT 'gray';

-- 2. Create index for folder queries
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_folder ON custom_shortcuts(parent_folder_id);

-- 3. Add location type support
ALTER TABLE custom_shortcuts 
DROP CONSTRAINT IF EXISTS custom_shortcuts_shortcut_type_check;

ALTER TABLE custom_shortcuts 
ADD CONSTRAINT custom_shortcuts_shortcut_type_check 
CHECK (shortcut_type IN ('action', 'url', 'contact', 'macro', 'location', 'folder'));

-- Add location fields
ALTER TABLE custom_shortcuts 
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- 4. User Presets (Saved Configurations)
CREATE TABLE IF NOT EXISTS user_shortcut_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preset_name TEXT NOT NULL,
    preset_description TEXT,
    shortcuts_config JSONB NOT NULL, -- Full snapshot of shortcuts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user presets
ALTER TABLE user_shortcut_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their presets" ON user_shortcut_presets;
CREATE POLICY "Users can manage their presets" ON user_shortcut_presets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_presets_user ON user_shortcut_presets(user_id);

-- 5. Update trigger for user_shortcut_presets
CREATE OR REPLACE FUNCTION update_user_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_presets_updated_at ON user_shortcut_presets;
CREATE TRIGGER user_presets_updated_at
    BEFORE UPDATE ON user_shortcut_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presets_updated_at();
