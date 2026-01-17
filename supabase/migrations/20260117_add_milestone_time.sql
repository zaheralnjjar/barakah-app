-- Add time column to thesis_milestones table
ALTER TABLE thesis_milestones ADD COLUMN IF NOT EXISTS time text;
