-- Add fab_settings column to system_modes table
ALTER TABLE public.system_modes 
ADD COLUMN IF NOT EXISTS fab_settings JSONB DEFAULT '{"visible": true}'::jsonb;
