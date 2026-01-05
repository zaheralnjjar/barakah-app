-- Academic Manager Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- Academic Projects Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    supervisor TEXT,
    institution TEXT,
    start_date DATE,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_projects
ALTER TABLE public.academic_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
    ON public.academic_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON public.academic_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.academic_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.academic_projects FOR DELETE
    USING (auth.uid() = user_id);

-- =========================================
-- Academic Phases Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.academic_projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on-hold')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_phases
ALTER TABLE public.academic_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view phases of their projects"
    ON public.academic_phases FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_phases.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create phases in their projects"
    ON public.academic_phases FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_phases.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update phases in their projects"
    ON public.academic_phases FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_phases.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete phases in their projects"
    ON public.academic_phases FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_phases.project_id AND user_id = auth.uid()
    ));

-- =========================================
-- Academic Chapters Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phase_id UUID REFERENCES public.academic_phases(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'writing', 'review', 'completed')),
    target_words INTEGER DEFAULT 0,
    current_words INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_chapters
ALTER TABLE public.academic_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chapters of their projects"
    ON public.academic_chapters FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_phases p
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE p.id = academic_chapters.phase_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can create chapters in their projects"
    ON public.academic_chapters FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_phases p
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE p.id = academic_chapters.phase_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can update chapters in their projects"
    ON public.academic_chapters FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_phases p
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE p.id = academic_chapters.phase_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete chapters in their projects"
    ON public.academic_chapters FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_phases p
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE p.id = academic_chapters.phase_id AND proj.user_id = auth.uid()
    ));

-- =========================================
-- Academic Materials Table (References/Sources)
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.academic_projects(id) ON DELETE CASCADE NOT NULL,
    type TEXT DEFAULT 'book' CHECK (type IN ('book', 'article', 'website', 'thesis', 'other')),
    title TEXT NOT NULL,
    author TEXT,
    year TEXT,
    publisher TEXT,
    url TEXT,
    pages TEXT,
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_materials
ALTER TABLE public.academic_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materials of their projects"
    ON public.academic_materials FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_materials.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create materials in their projects"
    ON public.academic_materials FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_materials.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update materials in their projects"
    ON public.academic_materials FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_materials.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete materials in their projects"
    ON public.academic_materials FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_materials.project_id AND user_id = auth.uid()
    ));

-- =========================================
-- Academic Research Circles Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_circles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.academic_projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    email TEXT,
    phone TEXT,
    type TEXT DEFAULT 'scholar' CHECK (type IN ('scholar', 'peer', 'reviewer', 'mentor')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_circles
ALTER TABLE public.academic_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view circles of their projects"
    ON public.academic_circles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_circles.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create circles in their projects"
    ON public.academic_circles FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_circles.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update circles in their projects"
    ON public.academic_circles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_circles.project_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete circles in their projects"
    ON public.academic_circles FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_projects 
        WHERE id = academic_circles.project_id AND user_id = auth.uid()
    ));

-- =========================================
-- Indexes for Performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_academic_projects_user_id ON public.academic_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_phases_project_id ON public.academic_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_academic_chapters_phase_id ON public.academic_chapters(phase_id);
CREATE INDEX IF NOT EXISTS idx_academic_materials_project_id ON public.academic_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_academic_circles_project_id ON public.academic_circles(project_id);

-- =========================================
-- Done! 
-- =========================================
-- After running this migration, the Academic Manager should work correctly.
