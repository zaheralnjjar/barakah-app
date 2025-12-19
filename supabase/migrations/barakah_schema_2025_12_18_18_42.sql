-- Create Barakah System Tables with Initial Zero Values
-- Current time: 2025-12-18 18:42 UTC

-- Finance Table (Mohamed - Financial Controller)
CREATE TABLE IF NOT EXISTS public.finance_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_balance_ars DECIMAL(12,2) DEFAULT 0.0,
    current_balance_usd DECIMAL(12,2) DEFAULT 0.0,
    daily_limit DECIMAL(10,2) DEFAULT 0.0,
    emergency_buffer DECIMAL(10,2) DEFAULT 445.0,
    total_debt DECIMAL(12,2) DEFAULT 0.0,
    exchange_rate DECIMAL(8,4) DEFAULT 1.0,
    pending_expenses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logistics Table (Fatima - Logistics Manager)
CREATE TABLE IF NOT EXISTS public.logistics_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    locations JSONB DEFAULT '[{"name": "San Cristóbal", "type": "area"}, {"name": "Dia", "type": "store"}, {"name": "Liniers", "type": "area"}]'::jsonb,
    shopping_list JSONB DEFAULT '[]'::jsonb,
    appointments JSONB DEFAULT '[]'::jsonb,
    medication_tracker JSONB DEFAULT '{"gonal": {"status": "pending", "schedule": []}, "ovidrel": {"status": "pending", "schedule": []}}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spiritual Table (Ahmed - Spiritual Guide)
CREATE TABLE IF NOT EXISTS public.spiritual_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prayer_time_source TEXT DEFAULT NULL,
    prayer_times JSONB DEFAULT '{}'::jsonb,
    quran_progress DECIMAL(5,2) DEFAULT 0.0,
    current_surah TEXT DEFAULT 'Al-Baqarah',
    sermon_reviews JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic Table (Youssef - Academic Coach)
CREATE TABLE IF NOT EXISTS public.academic_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    thesis_phase INTEGER DEFAULT 0,
    thesis_title TEXT DEFAULT 'Islamic Law & Minority Status',
    tasks_list JSONB DEFAULT '[]'::jsonb,
    synopsis_focus JSONB DEFAULT '{}'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Table (Sami - System Architect)
CREATE TABLE IF NOT EXISTS public.system_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    master_context_file JSONB DEFAULT '{}'::jsonb,
    logic_integrity_status TEXT DEFAULT 'active',
    database_sync_status TEXT DEFAULT 'synced',
    system_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legislation Table (Walid - Legislation Teacher)
CREATE TABLE IF NOT EXISTS public.legislation_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fiqh_lessons JSONB DEFAULT '[]'::jsonb,
    usul_lessons JSONB DEFAULT '[]'::jsonb,
    latin_america_context JSONB DEFAULT '[]'::jsonb,
    daily_benefits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Psychosocial Table (Saad - Psychosocial Advisor)
CREATE TABLE IF NOT EXISTS public.psychosocial_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mental_health_status TEXT DEFAULT 'stable',
    cultural_shock_level INTEGER DEFAULT 0,
    family_counseling_notes JSONB DEFAULT '[]'::jsonb,
    support_sessions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Table (Dr. Haifa - Health Advisor)
CREATE TABLE IF NOT EXISTS public.health_data_2025_12_18_18_42 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symptoms_log JSONB DEFAULT '[]'::jsonb,
    hormone_tracking JSONB DEFAULT '{}'::jsonb,
    vitamin_tracking JSONB DEFAULT '{}'::jsonb,
    lab_tests_queue JSONB DEFAULT '[]'::jsonb,
    medical_recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.finance_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychosocial_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data_2025_12_18_18_42 ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage own finance data" ON public.finance_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own logistics data" ON public.logistics_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spiritual data" ON public.spiritual_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own academic data" ON public.academic_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own system data" ON public.system_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own legislation data" ON public.legislation_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own psychosocial data" ON public.psychosocial_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own health data" ON public.health_data_2025_12_18_18_42
    FOR ALL USING (auth.uid() = user_id);

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION public.initialize_user_data_2025_12_18_18_42()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize all agent data for new user
    INSERT INTO public.finance_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.logistics_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.spiritual_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.academic_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.system_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.legislation_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.psychosocial_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    INSERT INTO public.health_data_2025_12_18_18_42 (user_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize data on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created_2025_12_18_18_42
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_data_2025_12_18_18_42();