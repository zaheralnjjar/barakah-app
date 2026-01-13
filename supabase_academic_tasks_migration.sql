-- Academic Tasks and Subtasks Migration
-- Run this SQL in your Supabase SQL Editor

-- =========================================
-- Academic Tasks Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chapter_id UUID REFERENCES public.academic_chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT DEFAULT '',
    deadline DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_tasks
ALTER TABLE public.academic_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of their projects"
    ON public.academic_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_chapters c
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE c.id = academic_tasks.chapter_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can create tasks in their projects"
    ON public.academic_tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_chapters c
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE c.id = academic_tasks.chapter_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can update tasks in their projects"
    ON public.academic_tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_chapters c
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE c.id = academic_tasks.chapter_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete tasks in their projects"
    ON public.academic_tasks FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_chapters c
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE c.id = academic_tasks.chapter_id AND proj.user_id = auth.uid()
    ));

-- =========================================
-- Academic Subtasks Table
-- =========================================
CREATE TABLE IF NOT EXISTS public.academic_subtasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.academic_tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE,
    time TIME,
    completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for academic_subtasks
ALTER TABLE public.academic_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of their projects"
    ON public.academic_subtasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.academic_tasks t
        JOIN public.academic_chapters c ON c.id = t.chapter_id
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE t.id = academic_subtasks.task_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can create subtasks in their projects"
    ON public.academic_subtasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.academic_tasks t
        JOIN public.academic_chapters c ON c.id = t.chapter_id
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE t.id = academic_subtasks.task_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can update subtasks in their projects"
    ON public.academic_subtasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.academic_tasks t
        JOIN public.academic_chapters c ON c.id = t.chapter_id
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE t.id = academic_subtasks.task_id AND proj.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete subtasks in their projects"
    ON public.academic_subtasks FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.academic_tasks t
        JOIN public.academic_chapters c ON c.id = t.chapter_id
        JOIN public.academic_phases p ON p.id = c.phase_id
        JOIN public.academic_projects proj ON proj.id = p.project_id
        WHERE t.id = academic_subtasks.task_id AND proj.user_id = auth.uid()
    ));

-- =========================================
-- Add missing columns to academic_chapters
-- =========================================
ALTER TABLE public.academic_chapters 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.academic_chapters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS color TEXT;

-- =========================================
-- Add missing columns to academic_phases
-- =========================================
ALTER TABLE public.academic_phases 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- =========================================
-- Add missing columns to academic_materials
-- =========================================
ALTER TABLE public.academic_materials 
ADD COLUMN IF NOT EXISTS death_date TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'to_read' CHECK (status IN ('to_read', 'reading', 'read'));

-- =========================================
-- Add missing columns to academic_circles
-- =========================================
ALTER TABLE public.academic_circles
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- =========================================
-- Indexes for Performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_academic_tasks_chapter_id ON public.academic_tasks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_academic_subtasks_task_id ON public.academic_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_academic_chapters_parent_id ON public.academic_chapters(parent_id);

-- =========================================
-- Done!
-- =========================================
