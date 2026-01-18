-- Add metadata and items columns to salary_statements for detailed pay slips
ALTER TABLE public.salary_statements 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.salary_statements.metadata IS 'Stores header info like Employer Name, CUIT, Seniority, etc.';
COMMENT ON COLUMN public.salary_statements.items IS 'Stores detailed line items (Concept, Units, Amounts) exactly as in the pay slip';
