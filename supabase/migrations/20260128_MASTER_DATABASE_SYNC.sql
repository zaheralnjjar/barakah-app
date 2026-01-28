-- ==============================================================================
-- 🚀 BARAKAH SYSTEM: MASTER DATABASE UPGRADE (JAN 2026)
-- Combining all recent features: Medications, Secure Vault, Salary, Shortcuts,
-- Hidaya Plus, and Advanced System Modes.
-- ==============================================================================

-- 0. SETTINGS & HELPERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. CORE LIFESTYLE: MEDICATIONS & TASKS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time TEXT DEFAULT '08:00',
  frequency TEXT DEFAULT 'daily', 
  custom_days TEXT[] DEFAULT '{}',
  start_date TEXT,
  end_date TEXT,
  is_permanent BOOLEAN DEFAULT true,
  reminder BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    taken BOOLEAN DEFAULT false,
    taken_at TIMESTAMPTZ,
    UNIQUE(medication_id, date)
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own medications" ON medications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own med logs" ON medication_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 2. PROFESSIONAL: SECURE VAULT & SALARY
-- ==============================================================================

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
    metadata JSONB DEFAULT '{}'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

ALTER TABLE public.secure_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_statements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users Access Policy" ON secure_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users Access Policy" ON password_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users Access Policy" ON salary_statements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 3. CUSTOM SHORTCUTS & MACROS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS custom_shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    custom_name TEXT NOT NULL,
    custom_icon TEXT NOT NULL, 
    icon_color TEXT DEFAULT 'gray',
    click_action_id TEXT, 
    long_press_action_id TEXT, 
    click_macro JSONB, 
    long_press_macro JSONB,
    shortcut_type TEXT DEFAULT 'action' CHECK (shortcut_type IN ('action', 'url', 'contact', 'macro')),
    url TEXT, 
    contact_phone TEXT, 
    contact_name TEXT,
    placement TEXT DEFAULT 'shortcuts_grid' CHECK (placement IN ('quick_access', 'shortcuts_grid')),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_shortcuts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Users manage shortcuts" ON custom_shortcuts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 4. HIDAYA PLUS: NEW MUSLIM TRACKING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, 
    type TEXT CHECK (type IN ('whatsapp', 'call', 'sms', 'email', 'visit')),
    direction TEXT DEFAULT 'sent' CHECK (direction IN ('sent', 'received')),
    content TEXT NOT NULL,
    notes TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    topic TEXT NOT NULL,
    teacher TEXT,
    duration INTEGER, 
    attended BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users Access Policy" ON communications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users Access Policy" ON lessons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 5. ADVANCED SYSTEM MODES (The New Profiles)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Zap',
    color TEXT DEFAULT '#8b5cf6',
    is_active BOOLEAN DEFAULT FALSE,
    auto_activate BOOLEAN DEFAULT FALSE,
    start_time TIME, 
    end_time TIME,
    recurrence TEXT DEFAULT 'daily', 
    mode_items JSONB DEFAULT '[]'::jsonb,
    shortcut_ids UUID[] DEFAULT '{}',
    location_ids UUID[] DEFAULT '{}',
    custom_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mode_activation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode_id UUID REFERENCES public.system_modes(id) ON DELETE CASCADE,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

ALTER TABLE public.system_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mode_activation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users manage modes" ON system_modes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users view logs" ON mode_activation_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 6. ENABLE REALTIME FOR KEY TABLES
-- ==============================================================================
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medications;
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_shortcuts;
    ALTER PUBLICATION supabase_realtime ADD TABLE system_modes;
    ALTER PUBLICATION supabase_realtime ADD TABLE salary_statements;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 7. AUTO-REFRESH TRIGGERS
-- ==============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('medications', 'secure_documents', 'password_entries', 'salary_statements', 'custom_shortcuts', 'system_modes')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp ON %I', t);
        EXECUTE format('CREATE TRIGGER update_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END $$;

-- ==============================================================================
-- ✅ DONE: ALL TABLES PREPARED
-- ==============================================================================
