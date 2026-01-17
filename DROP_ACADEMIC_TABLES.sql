-- Drop Academic Tables from Supabase
-- Run this SQL in Supabase SQL Editor to remove academic-related tables

-- 1. Drop the main academic data table
DROP TABLE IF EXISTS public.academic_data_2025_12_18_18_42 CASCADE;

-- 2. Drop academic research tables (if they exist)
DROP TABLE IF EXISTS public.academic_projects CASCADE;
DROP TABLE IF EXISTS public.academic_phases CASCADE;
DROP TABLE IF EXISTS public.academic_chapters CASCADE;
DROP TABLE IF EXISTS public.academic_references CASCADE;
DROP TABLE IF EXISTS public.academic_materials CASCADE;
DROP TABLE IF EXISTS public.academic_tasks CASCADE;

-- 3. Drop any RLS policies for academic tables (if they exist)
-- Note: CASCADE in DROP TABLE should handle this, but just to be safe

-- 4. Remove academic initialization from the trigger function
-- You may need to update initialize_user_data_2025_12_18_18_42() function
-- to remove the academic data initialization line

-- Done!
-- After running this script, the academic section will be completely removed from the database.
