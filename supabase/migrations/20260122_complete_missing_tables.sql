-- ============================================================
-- COMPLETE MISSING TABLES FOR BARAKAH APP
-- Created: 2026-01-22
-- Run this in Supabase SQL Editor
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ============================================================
-- 1. QUICK NOTES TABLE (For syncing notes across devices)
-- ============================================================
CREATE TABLE IF NOT EXISTS quick_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'ملاحظة',
    content TEXT,
    color TEXT DEFAULT '#ffffffff',
    folder_id UUID,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_activities BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note Folders
CREATE TABLE IF NOT EXISTS note_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4ade80',
    icon TEXT DEFAULT 'folder',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. RECURRING EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ARS',
    category TEXT,
    frequency TEXT DEFAULT 'monthly',
    due_day INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_processed DATE,
    next_due DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. USER SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'ar',
    theme TEXT DEFAULT 'light',
    currency TEXT DEFAULT 'ARS',
    date_format TEXT DEFAULT 'dd/MM/yyyy',
    calculation_method TEXT DEFAULT 'MWL',
    asr_juristic TEXT DEFAULT 'Standard',
    prayer_notifications BOOLEAN DEFAULT TRUE,
    prayer_notification_minutes INTEGER DEFAULT 10,
    daily_limit_enabled BOOLEAN DEFAULT TRUE,
    financial_cycle_start INTEGER DEFAULT 1,
    emergency_buffer NUMERIC DEFAULT 0,
    default_task_priority TEXT DEFAULT 'medium',
    pomodoro_duration INTEGER DEFAULT 25,
    break_duration INTEGER DEFAULT 5,
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 5,
    google_sheets_enabled BOOLEAN DEFAULT FALSE,
    google_sheets_ids JSONB DEFAULT '[]'::jsonb,
    pin_enabled BOOLEAN DEFAULT FALSE,
    pin_hash TEXT,
    dashboard_order JSONB DEFAULT '["stats", "appointments", "shopping", "map"]'::jsonb,
    section_order JSONB DEFAULT '["finance", "tasks", "calendar", "prayer"]'::jsonb,
    task_notifications BOOLEAN DEFAULT TRUE,
    appointment_notifications BOOLEAN DEFAULT TRUE,
    medication_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. FAVORITE CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorite_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    emoji TEXT DEFAULT '👤',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PRAYER SCHEDULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    source TEXT DEFAULT 'api',
    location_lat NUMERIC,
    location_lng NUMERIC,
    location_name TEXT,
    times JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year, month)
);

-- ============================================================
-- 6. POMODORO SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT,
    task_title TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. DAILY REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    content TEXT NOT NULL,
    shared_to TEXT[],
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. NOTIFICATION PREFERENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    prayer_enabled BOOLEAN DEFAULT TRUE,
    prayer_before_minutes INTEGER DEFAULT 10,
    prayer_sound TEXT DEFAULT 'default',
    prayer_vibrate BOOLEAN DEFAULT TRUE,
    task_enabled BOOLEAN DEFAULT TRUE,
    task_before_minutes INTEGER DEFAULT 30,
    appointment_enabled BOOLEAN DEFAULT TRUE,
    appointment_before_minutes INTEGER DEFAULT 15,
    medication_enabled BOOLEAN DEFAULT TRUE,
    medication_before_minutes INTEGER DEFAULT 5,
    daily_summary_enabled BOOLEAN DEFAULT TRUE,
    daily_summary_time TEXT DEFAULT '08:00',
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_start TEXT DEFAULT '22:00',
    quiet_end TEXT DEFAULT '06:00',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. CAR PARKING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS car_parking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address TEXT,
    notes TEXT,
    photo_url TEXT,
    parked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE RLS POLICIES (DROP FIRST TO AVOID ERRORS)
-- ============================================================

-- Quick Notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON quick_notes;
CREATE POLICY "Users can manage their own notes" ON quick_notes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note Folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON note_folders;
CREATE POLICY "Users can manage their own folders" ON note_folders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recurring Expenses
DROP POLICY IF EXISTS "Users can manage their own recurring expenses" ON recurring_expenses;
CREATE POLICY "Users can manage their own recurring expenses" ON recurring_expenses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorite Contacts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON favorite_contacts;
CREATE POLICY "Users can manage their own contacts" ON favorite_contacts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prayer Schedules
DROP POLICY IF EXISTS "Users can manage their own prayer schedules" ON prayer_schedules;
CREATE POLICY "Users can manage their own prayer schedules" ON prayer_schedules
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pomodoro Sessions
DROP POLICY IF EXISTS "Users can manage their own pomodoro sessions" ON pomodoro_sessions;
CREATE POLICY "Users can manage their own pomodoro sessions" ON pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily Reports
DROP POLICY IF EXISTS "Users can manage their own reports" ON daily_reports;
CREATE POLICY "Users can manage their own reports" ON daily_reports
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification Preferences
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Car Parking
DROP POLICY IF EXISTS "Users can manage their own parking" ON car_parking;
CREATE POLICY "Users can manage their own parking" ON car_parking
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Activity Log
DROP POLICY IF EXISTS "Users can view their own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity" ON activity_log;
CREATE POLICY "Users can view their own activity" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id ON quick_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_folder_id ON quick_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_updated_at ON quick_notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_note_folders_user_id ON note_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_due ON recurring_expenses(next_due);
CREATE INDEX IF NOT EXISTS idx_favorite_contacts_user_id ON favorite_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_schedules_user_month ON prayer_schedules(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON pomodoro_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, date);
CREATE INDEX IF NOT EXISTS idx_car_parking_user_id ON car_parking(user_id);
CREATE INDEX IF NOT EXISTS idx_car_parking_active ON car_parking(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- ============================================================
-- ENABLE REALTIME (using DO block to handle errors gracefully)
-- ============================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE quick_notes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE note_folders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE recurring_expenses;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE favorite_contacts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE car_parking;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quick_notes_updated_at ON quick_notes;
CREATE TRIGGER update_quick_notes_updated_at
    BEFORE UPDATE ON quick_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_expenses_updated_at ON recurring_expenses;
CREATE TRIGGER update_recurring_expenses_updated_at
    BEFORE UPDATE ON recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayer_schedules_updated_at ON prayer_schedules;
CREATE TRIGGER update_prayer_schedules_updated_at
    BEFORE UPDATE ON prayer_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-INITIALIZE SETTINGS FOR NEW USERS
-- ============================================================
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_settings();

-- ============================================================
-- DONE! All 11 tables created successfully
-- ============================================================
