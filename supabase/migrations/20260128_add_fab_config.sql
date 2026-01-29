-- ============================================================
-- ADD FAB CONFIGURATION TO USER SETTINGS
-- Date: 2026-01-28
-- ============================================================

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS fab_config JSONB DEFAULT '{
    "buttons": [
        { "id": 1, "icon": "MapPin", "tapAction": "save_location", "longPressAction": "open_maps", "color": "bg-green-500" },
        { "id": 2, "icon": "StickyNote", "tapAction": "new_note", "longPressAction": "voice_note", "color": "bg-yellow-500" },
        { "id": 3, "icon": "AlertTriangle", "tapAction": "log_distraction", "longPressAction": "view_history", "color": "bg-orange-500" },
        { "id": 4, "icon": "Calendar", "tapAction": "new_appointment", "longPressAction": "view_calendar", "color": "bg-purple-500" }
    ]
}'::jsonb;

-- Comment on column
COMMENT ON COLUMN user_settings.fab_config IS 'Stores the customization for the 4 sub-buttons of the Multi-Action FAB';
