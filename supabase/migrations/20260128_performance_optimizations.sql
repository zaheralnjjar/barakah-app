-- Database Performance Optimization Script
-- Adding indices to speed up queries without changing schema

-- 1. Performance Indices for Core Tables
CREATE INDEX IF NOT EXISTS idx_notes_v2_user_id ON public.notes_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_v2_updated_at ON public.notes_v2(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_thesis_projects_user_id ON public.thesis_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_tasks_user_id ON public.thesis_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_structure_project_id ON public.thesis_structure(project_id);

CREATE INDEX IF NOT EXISTS idx_salary_statements_user_id ON public.salary_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_password_entries_user_id ON public.password_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_documents_user_id ON public.secure_documents(user_id);

-- 2. GIN Indices for JSONB columns (Enables fast searching inside JSON blobs)
-- This is critical for the "Agent-based" tables that store everything in JSON
CREATE INDEX IF NOT EXISTS idx_logistics_data_jsonb ON public.logistics_data_2025_12_18_18_42 USING GIN (locations, shopping_list, appointments);
CREATE INDEX IF NOT EXISTS idx_academic_data_jsonb ON public.academic_data_2025_12_18_18_42 USING GIN (tasks_list, milestones);
CREATE INDEX IF NOT EXISTS idx_health_data_jsonb ON public.health_data_2025_12_18_18_42 USING GIN (symptoms_log, medical_recommendations);

-- 3. Full-Text Search Support (Future proofing global search)
-- We add a generated column for searching if needed, but for now simple ILIKE is fine 
-- after indexing user_id.
