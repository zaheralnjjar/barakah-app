-- -----------------------------------------------------------------------------
-- 🎓 ACADIA Thesis Manager Schema for Barakah System
-- -----------------------------------------------------------------------------

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.thesis_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    path TEXT, -- Local path for Electron mode
    target_chapters INT DEFAULT 5,
    target_words INT DEFAULT 50000,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Structure Table (Chapters, Sections, etc.)
CREATE TABLE IF NOT EXISTS public.thesis_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.thesis_structure(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('chapter', 'section', 'subsection', 'branch', 'issue', 'topic')),
    title TEXT NOT NULL,
    order_index INT DEFAULT 0,
    file_path TEXT, -- Path in Supabase Storage or Local
    content TEXT, -- Optional: store small content directly
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. References Table
CREATE TABLE IF NOT EXISTS public.thesis_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    type TEXT DEFAULT 'book',
    year TEXT,
    publisher TEXT,
    pages TEXT,
    url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.thesis_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium',
    chapter_id UUID REFERENCES public.thesis_structure(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Milestones Table (Calendar)
CREATE TABLE IF NOT EXISTS public.thesis_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT DEFAULT 'milestone',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 🔒 RLS Policies
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.thesis_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_milestones ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view own projects" ON public.thesis_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.thesis_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.thesis_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.thesis_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Structure Policies (Access via project ownership)
CREATE POLICY "Users can manage structure of own projects" ON public.thesis_structure
    FOR ALL USING (project_id IN (SELECT id FROM public.thesis_projects WHERE user_id = auth.uid()));

-- References Policies
CREATE POLICY "Users can manage references of own projects" ON public.thesis_references
    FOR ALL USING (project_id IN (SELECT id FROM public.thesis_projects WHERE user_id = auth.uid()));

-- Tasks Policies
CREATE POLICY "Users can manage tasks of own projects" ON public.thesis_tasks
    FOR ALL USING (project_id IN (SELECT id FROM public.thesis_projects WHERE user_id = auth.uid()));

-- Milestones Policies
CREATE POLICY "Users can manage milestones of own projects" ON public.thesis_milestones
    FOR ALL USING (project_id IN (SELECT id FROM public.thesis_projects WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 🗄️ Storage Buckets
-- -----------------------------------------------------------------------------
-- Note: Run this via Dashboard or separate call if SQL editor doesn't support storage API directly
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thesis-files', 'thesis-files', false);
