-- ==========================================================
-- FINAL DATABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor to enable all features
-- ==========================================================

-- 1. Create 'salary_docs' Storage Bucket
-- (You must do this manually in Supabase Dashboard > Storage, 
--  but here is the policy if the bucket exists)
-- INSERT INTO storage.buckets (id, name) VALUES ('salary_docs', 'salary_docs') ON CONFLICT DO NOTHING;

-- 2. Create Tables

CREATE TABLE IF NOT EXISTS public.secure_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    site_name TEXT NOT NULL,
    username TEXT,
    encrypted_password TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    additions JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    pdf_url TEXT,
    notes TEXT,
    ai_insights TEXT[],
    -- New Professional Columns
    metadata JSONB DEFAULT '{}'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- 3. Enable RLS

ALTER TABLE public.secure_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_statements ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Safely)

DO $$ 
BEGIN
    -- Secure Documents Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own documents') THEN
        CREATE POLICY "Users can manage their own documents" ON public.secure_documents USING (auth.uid() = user_id);
    END IF;

    -- Password Entries Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own passwords') THEN
        CREATE POLICY "Users can manage their own passwords" ON public.password_entries USING (auth.uid() = user_id);
    END IF;

    -- Salary Statements Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own salary statements') THEN
        CREATE POLICY "Users can manage their own salary statements" ON public.salary_statements USING (auth.uid() = user_id);
    END IF;
END $$;
