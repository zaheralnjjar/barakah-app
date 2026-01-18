-- ==========================================
-- 1. Create VAULT Tables (If they don't exist)
-- ==========================================

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

-- ==========================================
-- 2. Create SALARY Table (If it doesn't exist)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.salary_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    base_salary NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    additions JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    pdf_url TEXT,
    notes TEXT,
    ai_insights TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- ==========================================
-- 3. Update SALARY Table (Add Professional Columns)
-- ==========================================

-- Add metadata and items columns if they don't exist
ALTER TABLE public.salary_statements 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- ==========================================
-- 4. Enable Security (RLS)
-- ==========================================

ALTER TABLE public.secure_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_statements ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop first to avoid errors if re-running)
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.secure_documents;
CREATE POLICY "Users can manage their own documents" ON public.secure_documents USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own passwords" ON public.password_entries;
CREATE POLICY "Users can manage their own passwords" ON public.password_entries USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own salary statements" ON public.salary_statements;
CREATE POLICY "Users can manage their own salary statements" ON public.salary_statements USING (auth.uid() = user_id);
