-- Add default_amount column to salary_concepts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_concepts' AND column_name = 'default_amount') THEN
        ALTER TABLE salary_concepts ADD COLUMN default_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Update specific concepts with standard values (from Recibo de Sueldo analysis)
-- These are approximate base values to help auto-fill
UPDATE salary_concepts SET default_amount = 1485640.00 WHERE name = 'BASICO 1°CAT. SUPERVISION';
UPDATE salary_concepts SET default_amount = 14856.40 WHERE name = 'ANTIGUEDAD'; -- Per unit (year)
UPDATE salary_concepts SET default_amount = 124793.76 WHERE name = 'PRESENTISMO';
UPDATE salary_concepts SET default_amount = 70000.00 WHERE name = 'A CTA FUTUROS AUMENTOS';
UPDATE salary_concepts SET default_amount = 30000.00 WHERE name LIKE 'BONIF%';
UPDATE salary_concepts SET default_amount = 5000.00 WHERE name LIKE 'ASIG%';
UPDATE salary_concepts SET default_amount = 75000.00 WHERE name = 'SUMA NO REM BASICO C/OS';
UPDATE salary_concepts SET default_amount = 10000.00 WHERE name = 'SUMA NO REM BRUTO C/OS';
UPDATE salary_concepts SET default_amount = 0 WHERE type = 'deduction'; -- Deductions are calculated as % usually, but we set amount to 0 effectively
