-- Add data column to tracker_entries table to support complex data (JSONB)
ALTER TABLE public.tracker_entries ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
