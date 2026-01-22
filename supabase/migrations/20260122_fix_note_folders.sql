-- ============================================================
-- FIX: Drop and recreate note_folders table
-- Run this FIRST before the main migration
-- ============================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS note_folders CASCADE;

-- Now run the main migration file:
-- 20260122_advanced_notes_system.sql
