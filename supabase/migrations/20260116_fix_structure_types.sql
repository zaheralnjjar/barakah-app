-- Update the check constraint to include 'branch' and 'issue'
ALTER TABLE public.thesis_structure DROP CONSTRAINT IF EXISTS thesis_structure_type_check;

ALTER TABLE public.thesis_structure ADD CONSTRAINT thesis_structure_type_check 
    CHECK (type IN ('chapter', 'section', 'subsection', 'topic', 'issue', 'branch'));
