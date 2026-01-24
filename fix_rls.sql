-- Enable RLS
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON quick_notes;

-- Create comprehensive policies
CREATE POLICY "Users can view their own notes" 
ON quick_notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" 
ON quick_notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON quick_notes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON quick_notes FOR DELETE 
USING (auth.uid() = user_id);
