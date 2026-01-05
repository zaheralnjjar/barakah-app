-- Create academic_projects table
CREATE TABLE IF NOT EXISTS academic_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    supervisor TEXT,
    institution TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic_phases table
CREATE TABLE IF NOT EXISTS academic_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES academic_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic_chapters table
CREATE TABLE IF NOT EXISTS academic_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES academic_phases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- The main text content
    status TEXT DEFAULT 'pending',
    order_index INTEGER DEFAULT 0,
    tags TEXT[], -- For tagging system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic_materials table
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

-- Create academic_circles table
CREATE TABLE IF NOT EXISTS academic_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES academic_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE academic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_circles ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow CRUD only for own data)
CREATE POLICY "Users can manage their own projects" ON academic_projects
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage phases of their projects" ON academic_phases
    USING (project_id IN (SELECT id FROM academic_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage chapters of their phases" ON academic_chapters
    USING (phase_id IN (SELECT id FROM academic_phases WHERE project_id IN (SELECT id FROM academic_projects WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage materials of their projects" ON academic_materials
    USING (project_id IN (SELECT id FROM academic_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage circles of their projects" ON academic_circles
    USING (project_id IN (SELECT id FROM academic_projects WHERE user_id = auth.uid()));
