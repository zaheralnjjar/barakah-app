-- Add start_time and end_time to distraction_logs
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
