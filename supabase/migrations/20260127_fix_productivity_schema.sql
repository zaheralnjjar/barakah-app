-- Create medications table if not exists
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  time TEXT DEFAULT '08:00',
  frequency TEXT DEFAULT 'daily', -- daily, weekly, monthly, specific_days
  custom_days TEXT[] DEFAULT '{}',
  start_date TEXT,
  end_date TEXT,
  is_permanent BOOLEAN DEFAULT true,
  reminder BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs if not exists
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users NOT NULL,
    date TEXT NOT NULL,
    taken BOOLEAN DEFAULT false,
    taken_at TIMESTAMPTZ,
    UNIQUE(medication_id, date)
);

-- Enhance tasks table to support projects and goals
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'task'; 
-- Allow RLS checks if needed, but assuming simple setup for now.

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Medications
CREATE POLICY "Users can insert their own medications" ON medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own medications" ON medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own medications" ON medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medications" ON medications FOR DELETE USING (auth.uid() = user_id);

-- Policies for Logs
CREATE POLICY "Users can insert their own med logs" ON medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own med logs" ON medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own med logs" ON medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own med logs" ON medication_logs FOR DELETE USING (auth.uid() = user_id);
