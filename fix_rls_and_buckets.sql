-- 1. Create buckets table for cloud-synced categories
CREATE TABLE IF NOT EXISTS public.buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'Star',
    color TEXT NOT NULL DEFAULT 'text-blue-500',
    bg_color TEXT NOT NULL DEFAULT 'bg-blue-50',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on buckets
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;

-- Buckets Policies
DROP POLICY IF EXISTS "Users can manage their own buckets" ON public.buckets;
CREATE POLICY "Users can manage their own buckets"
    ON public.buckets
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Fix quick_notes RLS (Ensure DELETE and UPDATE are allowed for owners)
-- This fixes the issue where notes cannot be deleted or updated.
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.quick_notes;
CREATE POLICY "Users can manage their own notes"
    ON public.quick_notes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Add updated_at trigger functionality
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for buckets
DROP TRIGGER IF EXISTS on_bucket_updated ON public.buckets;
CREATE TRIGGER on_bucket_updated
    BEFORE UPDATE ON public.buckets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
