-- Create Trackers table
CREATE TABLE IF NOT EXISTS public.trackers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('numeric', 'scale', 'boolean', 'text', 'time')),
    settings JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Tracker Entries table
CREATE TABLE IF NOT EXISTS public.tracker_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
    value NUMERIC, 
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_entries ENABLE ROW LEVEL SECURITY;

-- Policies for Trackers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own trackers') THEN
        CREATE POLICY "Users can view their own trackers" ON public.trackers FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own trackers') THEN
        CREATE POLICY "Users can insert their own trackers" ON public.trackers FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own trackers') THEN
        CREATE POLICY "Users can update their own trackers" ON public.trackers FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own trackers') THEN
        CREATE POLICY "Users can delete their own trackers" ON public.trackers FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Policies for Entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own entries') THEN
        CREATE POLICY "Users can view their own entries" ON public.tracker_entries FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own entries') THEN
        CREATE POLICY "Users can insert their own entries" ON public.tracker_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own entries') THEN
        CREATE POLICY "Users can update their own entries" ON public.tracker_entries FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own entries') THEN
        CREATE POLICY "Users can delete their own entries" ON public.tracker_entries FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trackers_user_id ON public.trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_tracker_id ON public.tracker_entries(tracker_id);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_user_id ON public.tracker_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_date ON public.tracker_entries(date);
