-- ============================================================
-- ADVANCED SYSTEM MODES (Permanent Modes Upgrade)
-- Date: 2026-01-28
-- Description: Adds professional tables for system profiles/modes
--              including tasks, shortcuts, locations, and macros.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Zap',
    color TEXT DEFAULT '#8b5cf6',
    
    -- Mode configuration
    is_active BOOLEAN DEFAULT FALSE,
    auto_activate BOOLEAN DEFAULT FALSE,
    start_time TIME, -- Optional: Auto-activation time
    end_time TIME,
    recurrence TEXT DEFAULT 'daily', -- daily, weekly, monthly
    
    -- Items (Tasks, Appointments, Medications, Habits)
    -- Stored as JSONB for flexibility within the mode definition
    mode_items JSONB DEFAULT '[]'::jsonb,
    
    -- IDs of shortcuts to show when this mode is active
    shortcut_ids UUID[] DEFAULT '{}',
    
    -- IDs of locations to prioritize
    location_ids UUID[] DEFAULT '{}',
    
    -- Custom Communication / Macros
    -- { "trigger": "on_start", "action": "send_whatsapp", "recipient": "...", "message": "..." }
    custom_actions JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Mode Log (to trace history)
CREATE TABLE IF NOT EXISTS public.mode_activation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode_id UUID REFERENCES public.system_modes(id) ON DELETE CASCADE,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

-- ==========================================
-- ENABLE SECURITY (RLS)
-- ==========================================
ALTER TABLE public.system_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mode_activation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own modes" ON public.system_modes;
CREATE POLICY "Users can manage their own modes" ON public.system_modes 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their activity logs" ON public.mode_activation_logs;
CREATE POLICY "Users can view their activity logs" ON public.mode_activation_logs 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_modes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS update_system_modes_timestamp ON public.system_modes;
CREATE TRIGGER update_system_modes_timestamp 
    BEFORE UPDATE ON public.system_modes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
