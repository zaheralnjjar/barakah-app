-- Migration: Custom Shortcuts Table
-- Date: 2026-01-27
-- Description: Full shortcut customization with click/long-press actions, macros, and special types

-- 1. Main custom_shortcuts table
CREATE TABLE IF NOT EXISTS custom_shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    custom_name TEXT NOT NULL,
    custom_icon TEXT NOT NULL, -- Lucide icon name or emoji
    icon_color TEXT DEFAULT 'gray', -- Conditional color support
    
    -- Actions
    click_action_id TEXT, -- Standard action from AVAILABLE_ACTIONS
    long_press_action_id TEXT, -- Optional second action
    
    -- Macro support (JSON array of action IDs)
    click_macro JSONB, -- Example: ["start_pomodoro", "power_mode"]
    long_press_macro JSONB,
    
    -- Special types
    shortcut_type TEXT DEFAULT 'action' CHECK (shortcut_type IN ('action', 'url', 'contact', 'macro')),
    url TEXT, -- For URL shortcuts
    contact_phone TEXT, -- For contact shortcuts
    contact_name TEXT,
    
    -- Placement & Order
    placement TEXT DEFAULT 'shortcuts_grid' CHECK (placement IN ('quick_access', 'shortcuts_grid')),
    order_index INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_user ON custom_shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_placement ON custom_shortcuts(placement);

-- RLS Policies
ALTER TABLE custom_shortcuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their custom shortcuts" ON custom_shortcuts;
CREATE POLICY "Users can manage their custom shortcuts" ON custom_shortcuts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Shortcut presets table (optional - for sharing/templates)
CREATE TABLE IF NOT EXISTS shortcut_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    shortcuts JSONB NOT NULL, -- Array of shortcut configurations
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for presets
ALTER TABLE shortcut_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public presets" ON shortcut_presets
    FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Users can manage their own presets" ON shortcut_presets
    FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- 3. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_custom_shortcuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_shortcuts_updated_at ON custom_shortcuts;
CREATE TRIGGER custom_shortcuts_updated_at
    BEFORE UPDATE ON custom_shortcuts
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_shortcuts_updated_at();
