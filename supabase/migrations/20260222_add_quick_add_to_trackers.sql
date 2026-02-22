-- Add quick_add_increment column to trackers table
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS quick_add_increment numeric;
