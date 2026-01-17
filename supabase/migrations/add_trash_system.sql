-- Migration: Add soft delete columns to thesis_projects
-- Created: 2026-01-16

-- Add columns for soft delete
ALTER TABLE thesis_projects 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for performance (only index deleted projects)
CREATE INDEX IF NOT EXISTS idx_thesis_projects_deleted_at 
ON thesis_projects(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Create index for active projects (most common query)
CREATE INDEX IF NOT EXISTS idx_thesis_projects_active 
ON thesis_projects(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN thesis_projects.deleted_at IS 'Timestamp when project was moved to trash';
COMMENT ON COLUMN thesis_projects.deleted_by IS 'User ID who deleted the project';
