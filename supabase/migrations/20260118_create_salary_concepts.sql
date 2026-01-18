-- Create salary_concepts table
CREATE TABLE IF NOT EXISTS salary_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('remunerative', 'non_remunerative', 'deduction')),
    default_units NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salary_concepts ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (all authenticated users can read)
CREATE POLICY "Allow read access for authenticated users" ON salary_concepts
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for insert/update (optional, for admin or user customization later)
CREATE POLICY "Allow all access for authenticated users" ON salary_concepts
    FOR ALL
    TO authenticated
    USING (true);

-- Seed Initial Data from the Salary Slip Image
INSERT INTO salary_concepts (name, type, default_units, order_index) VALUES
    -- Remunerative Items (Hab. c/ret.)
    ('BASICO 1°CAT. SUPERVISION', 'remunerative', 1.00, 10),
    ('ANTIGUEDAD', 'remunerative', 10.00, 20),
    ('PRESENTISMO', 'remunerative', 10.00, 30),
    ('A CTA FUTUROS AUMENTOS', 'remunerative', 1.00, 40),
    ('BONIF X IDIOMA/TITULO (HS)', 'remunerative', 1.00, 50),
    ('ASIG. POR ACT. CULTURALES', 'remunerative', 1.00, 60),
    ('ASIG. POR ACT. RELIGIOSAS', 'remunerative', 1.00, 70),
    ('PLUS VACACIONAL', 'remunerative', 15.00, 80),

    -- Non-Remunerative Items (Hab. s/ret.)
    ('SUMA NO REM BASICO C/OS', 'non_remunerative', 1.00, 100),
    ('SUMA NO REM BRUTO C/OS', 'non_remunerative', 1.00, 110),
    ('REDONDEO', 'non_remunerative', 1.00, 120),

    -- Deductions (Deducciones)
    ('JUBILACION', 'deduction', 11.00, 200),
    ('LEY 19032', 'deduction', 3.00, 210),
    ('O. SOCIAL (003108) OSPAÑA', 'deduction', 3.00, 220),
    ('U.T.E.D.Y.C.(3%)', 'deduction', 3.00, 230);
