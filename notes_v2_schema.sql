
-- Independent Schema for Notes V2 System

-- 1. Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide icon name or emoji
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Advanced Notes Table (V2)
CREATE TABLE IF NOT EXISTS public.notes_v2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    title TEXT,
    content TEXT, -- HTML content from Tiptap
    cover_image TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_v2 ENABLE ROW LEVEL SECURITY;

-- Policies for Folders
CREATE POLICY "Users can fully manage their own folders" ON public.folders
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Notes
CREATE POLICY "Users can fully manage their own notes v2" ON public.notes_v2
    FOR ALL USING (auth.uid() = user_id);

-- 4. Realtime (Optional but good for sync)
alter publication supabase_realtime add table public.folders;
alter publication supabase_realtime add table public.notes_v2;
