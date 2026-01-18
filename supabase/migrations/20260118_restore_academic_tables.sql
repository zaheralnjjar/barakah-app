-- Restore Academic tables (Thesis Manager)

-- 1. Thesis Projects Table
CREATE TABLE IF NOT EXISTS thesis_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    path TEXT,
    target_chapters INTEGER DEFAULT 0,
    target_words INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    supervisor TEXT,
    university TEXT,
    start_date DATE,
    deadline DATE,
    template TEXT,
    storage_mode TEXT DEFAULT 'local',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 2. Thesis Structure (Chapters/Sections)
CREATE TABLE IF NOT EXISTS thesis_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES thesis_projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES thesis_structure(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('chapter', 'section', 'subsection', 'branch', 'topic', 'issue')),
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    content TEXT,
    status TEXT DEFAULT 'draft',
    notes TEXT,
    word_count INTEGER DEFAULT 0,
    milestone_date TIMESTAMPTZ,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Thesis Tasks
CREATE TABLE IF NOT EXISTS thesis_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES thesis_projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES thesis_structure(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    reminder_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Thesis References
CREATE TABLE IF NOT EXISTS thesis_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    year TEXT,
    publisher TEXT,
    type TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Thesis Milestones (was missing - causing delete errors)
CREATE TABLE IF NOT EXISTS thesis_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE,
    time TEXT,
    type TEXT DEFAULT 'milestone',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE thesis_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesis_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesis_references ENABLE ROW LEVEL SECURITY;

-- Create Policies (Simple allow all for authenticated users for now, or per user)
CREATE POLICY "Users can manage their own projects" ON thesis_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own structure" ON thesis_structure
    FOR ALL USING (project_id IN (SELECT id FROM thesis_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own tasks" ON thesis_tasks
    FOR ALL USING (project_id IN (SELECT id FROM thesis_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own references" ON thesis_references
    FOR ALL USING (project_id IN (SELECT id FROM thesis_projects WHERE user_id = auth.uid()));
