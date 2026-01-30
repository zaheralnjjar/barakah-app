-- Add start_time and end_time columns to distraction_logs table
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_time timestamp with time zone;
