-- Add category column to distraction_logs table
ALTER TABLE distraction_logs 
ADD COLUMN IF NOT EXISTS category text;
