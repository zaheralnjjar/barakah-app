-- Expand allowed types for trackers table to include checklist, select, mood, time_range
DO $$ 
BEGIN
    -- Drop the old constraint
    ALTER TABLE public.trackers DROP CONSTRAINT IF EXISTS trackers_type_check;
    
    -- Add new constraint with all supported types
    ALTER TABLE public.trackers ADD CONSTRAINT trackers_type_check 
    CHECK (type IN ('numeric', 'scale', 'boolean', 'text', 'time', 'checklist', 'select', 'mood', 'time_range'));
END $$;
