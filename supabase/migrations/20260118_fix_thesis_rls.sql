-- Fix RLS Policies for Thesis Projects
-- Problem: Projects created previously might have NULL user_id, preventing deletion/updates.
-- Solution: Allow access to rows where user_id is NULL or matches currently logged in user.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON thesis_projects;
DROP POLICY IF EXISTS "Users can manage their own structure" ON thesis_structure;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON thesis_tasks;
DROP POLICY IF EXISTS "Users can manage their own references" ON thesis_references;

-- Create more permissive policies
-- 1. Projects
CREATE POLICY "Users can manage own or legacy projects" ON thesis_projects
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 2. Structure
CREATE POLICY "Users can manage own or legacy structure" ON thesis_structure
    FOR ALL USING (
        project_id IN (
            SELECT id FROM thesis_projects 
            WHERE user_id = auth.uid() OR user_id IS NULL
        )
    );

-- 3. Tasks
CREATE POLICY "Users can manage own or legacy tasks" ON thesis_tasks
    FOR ALL USING (
        project_id IN (
            SELECT id FROM thesis_projects 
            WHERE user_id = auth.uid() OR user_id IS NULL
        )
    );

-- 4. References
CREATE POLICY "Users can manage own or legacy references" ON thesis_references
    FOR ALL USING (
        project_id IN (
            SELECT id FROM thesis_projects 
            WHERE user_id = auth.uid() OR user_id IS NULL
        )
    );
