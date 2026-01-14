-- Create academic_materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS academic_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES academic_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- book, paper, link, other
    url TEXT,
    status TEXT DEFAULT 'to_read', -- to_read, reading, read
    author TEXT,
    publisher TEXT,
    year TEXT,
    death_date TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE academic_materials ENABLE ROW LEVEL SECURITY;

-- Create Policy
DROP POLICY IF EXISTS "Users can manage materials of their projects" ON academic_materials;
CREATE POLICY "Users can manage materials of their projects" ON academic_materials
    USING (project_id IN (SELECT id FROM academic_projects WHERE user_id = auth.uid()));
