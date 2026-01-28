-- Add duration_minutes column to distraction_logs
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
