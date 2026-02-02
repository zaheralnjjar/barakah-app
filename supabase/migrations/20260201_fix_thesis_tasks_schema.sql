-- Ensure thesis_tasks table exists
CREATE TABLE IF NOT EXISTS public.thesis_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    priority TEXT DEFAULT 'medium', -- low, medium, high
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    reminder_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.thesis_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own thesis tasks" ON public.thesis_tasks
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.thesis_projects WHERE id = project_id));

CREATE POLICY "Users can insert their own thesis tasks" ON public.thesis_tasks
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.thesis_projects WHERE id = project_id));

CREATE POLICY "Users can update their own thesis tasks" ON public.thesis_tasks
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.thesis_projects WHERE id = project_id));

CREATE POLICY "Users can delete their own thesis tasks" ON public.thesis_tasks
    FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.thesis_projects WHERE id = project_id));

-- Add project_id to global tasks table to allow linking/merging if desired in future (Optional but good for integration)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.thesis_projects(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_thesis_task BOOLEAN DEFAULT false;
