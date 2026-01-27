-- 1. جدول جهات الاتصال المفضلة
CREATE TABLE IF NOT EXISTS favorite_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    slot INTEGER CHECK (slot IN (1, 2)), -- لتحديد الزر 1 أو 2
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, slot)
);

-- RLS for favorite_contacts
ALTER TABLE favorite_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorite contacts" ON favorite_contacts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 2. جدول الطوارئ/الملف الطبي
CREATE TABLE IF NOT EXISTS medical_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    blood_type TEXT,
    allergies TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for medical_profile
ALTER TABLE medical_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own medical profile" ON medical_profile
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. سجلات التشتت (لتحليل الإنتاجية)
CREATE TABLE IF NOT EXISTS distraction_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id), -- Changed to TEXT to match tasks table definition
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for distraction_logs
ALTER TABLE distraction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own distraction logs" ON distraction_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. تحديث جدول الأماكن ليشمل "موقع السيارة" بشكل صريح إن لم يكن موجوداً
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_locations' AND column_name = 'type') THEN
        ALTER TABLE saved_locations ADD COLUMN type TEXT DEFAULT 'general';
    END IF;
END $$;
