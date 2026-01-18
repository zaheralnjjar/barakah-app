-- Migration: Add Secure Vault and Salary Manager tables
-- Date: 2026-01-17

-- =============================================
-- 1. SECURE DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS secure_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE secure_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own documents" ON secure_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON secure_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON secure_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON secure_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_secure_documents_user_id ON secure_documents(user_id);
CREATE INDEX idx_secure_documents_expiry ON secure_documents(expiry_date);

-- =============================================
-- 2. PASSWORD ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS password_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE password_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own passwords" ON password_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passwords" ON password_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords" ON password_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords" ON password_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_password_entries_user_id ON password_entries(user_id);

-- =============================================
-- 3. SALARY STATEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS salary_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: "2026-01"
  pdf_url TEXT,
  
  -- Base salary
  base_salary DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Additions (JSONB array)
  -- Example: [{"type": "allowance", "name": "بدل سكن", "amount": 300}]
  additions JSONB DEFAULT '[]'::jsonb,
  
  -- Deductions (JSONB array)
  -- Example: [{"type": "tax", "name": "ضريبة الدخل", "amount": 80}]
  deductions JSONB DEFAULT '[]'::jsonb,
  
  -- Calculated net salary
  net_salary DECIMAL(12,2) DEFAULT 0,
  
  -- AI insights (JSONB array of strings)
  ai_insights JSONB DEFAULT '[]'::jsonb,
  
  -- User notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salary_statements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own salary" ON salary_statements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary" ON salary_statements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary" ON salary_statements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary" ON salary_statements
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_salary_statements_user_id ON salary_statements(user_id);
CREATE INDEX idx_salary_statements_month ON salary_statements(month);

-- Unique constraint: one statement per month per user
CREATE UNIQUE INDEX idx_salary_unique_month ON salary_statements(user_id, month);

-- =============================================
-- 4. HELPER FUNCTION: Calculate net salary
-- =============================================
CREATE OR REPLACE FUNCTION calculate_net_salary()
RETURNS TRIGGER AS $$
DECLARE
  total_additions DECIMAL(12,2);
  total_deductions DECIMAL(12,2);
BEGIN
  -- Calculate total additions
  SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
  INTO total_additions
  FROM jsonb_array_elements(NEW.additions) AS item;
  
  -- Calculate total deductions
  SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
  INTO total_deductions
  FROM jsonb_array_elements(NEW.deductions) AS item;
  
  -- Set net salary
  NEW.net_salary := NEW.base_salary + total_additions - total_deductions;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate net salary
CREATE TRIGGER trigger_calculate_net_salary
  BEFORE INSERT OR UPDATE ON salary_statements
  FOR EACH ROW
  EXECUTE FUNCTION calculate_net_salary();

-- =============================================
-- DONE
-- =============================================
