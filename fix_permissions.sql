-- Force cleanup of ALL policies to ensure fresh start
-- 1. for quick_notes
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.quick_notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.quick_notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.quick_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.quick_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.quick_notes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.quick_notes;

-- 2. for buckets
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.buckets;
DROP POLICY IF EXISTS "Users can view their own buckets" ON public.buckets;
DROP POLICY IF EXISTS "Users can insert their own buckets" ON public.buckets;
DROP POLICY IF EXISTS "Users can update their own buckets" ON public.buckets;
DROP POLICY IF EXISTS "Users can delete their own buckets" ON public.buckets;

-- Enable RLS
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;

-- Re-create Unified Policies
CREATE POLICY "Enable all actions for users based on user_id" ON public.quick_notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable all actions for users based on user_id" ON public.buckets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
