-- ============================================================
-- HIDAYA PLUS & ADVANCED APPOINTMENTS MIGRATION
-- Date: 2026-01-27
-- Description: Adds professional tables for New Muslims management, 
--              advanced appointments, and educational tracking.
-- ============================================================

-- 1. APPOINTMENTS TABLE (Advanced)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID, -- Optional: Link to a new muslim student
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT, -- e.g., 'lesson', 'meeting', 'visit', 'shahada'
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMMUNICATIONS LOG
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- Link to new_muslims.id
    type TEXT CHECK (type IN ('whatsapp', 'call', 'sms', 'email', 'visit')),
    direction TEXT DEFAULT 'sent' CHECK (direction IN ('sent', 'received')),
    content TEXT NOT NULL,
    notes TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EDUCATIONAL RESOURCES (Library)
CREATE TABLE IF NOT EXISTS public.educational_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('book', 'video', 'audio', 'document', 'link')),
    category TEXT, -- e.g., 'Aqidah', 'Fiqh', 'Quran', 'Seerah', 'Ethics'
    url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT MATERIALS TRACKING
CREATE TABLE IF NOT EXISTS public.student_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    material_id UUID NOT NULL REFERENCES public.educational_resources(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reading', 'completed')),
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LESSONS TRACKING
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    topic TEXT NOT NULL,
    teacher TEXT,
    duration INTEGER, -- In minutes
    attended BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXAMS & RESULTS
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    total_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    score NUMERIC,
    passed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STUDY PROTOCOLS (Curriculum Definition)
CREATE TABLE IF NOT EXISTS public.study_protocol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stages JSONB NOT NULL, -- Flexible structure for multi-stage curriculum
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE SECURITY (RLS)
-- ==========================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_protocol ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Creation
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'appointments', 'communications', 'educational_resources', 
            'student_materials', 'lessons', 'exams', 'exam_results', 'study_protocol'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User Access Policy" ON %I', t);
        EXECUTE format('CREATE POLICY "User Access Policy" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    END LOOP;
END $$;

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE communications;
    ALTER PUBLICATION supabase_realtime ADD TABLE educational_resources;
    ALTER PUBLICATION supabase_realtime ADD TABLE lessons;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('appointments', 'educational_resources', 'study_protocol')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp ON %I', t);
        EXECUTE format('CREATE TRIGGER update_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END $$;
