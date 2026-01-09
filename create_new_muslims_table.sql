-- Drop the table if it exists (optional, for clean recreation)
-- DROP TABLE IF EXISTS new_muslims;

-- Create the new_muslims table with columns matching the Excel file EXACTLY
CREATE TABLE new_muslims (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Excel columns (matching header names exactly)
    foto TEXT,                              -- Foto
    con_el_sheij TEXT,                      -- Con el sheij
    fecha_cuando TEXT,                      -- Fecha cuando (conversion date)
    nacionalidad TEXT,                      -- Nacionalidad
    dni TEXT,                               -- Dni
    estudio TEXT,                           -- Estudio
    trabajo TEXT,                           -- Trabajo
    whatsapp TEXT,                          -- WhatsApp
    que_dias_tiene TEXT,                    -- Que dias tiene (libres)
    ciudad_donde TEXT,                      -- Ciudad donde (vives)
    edad TEXT,                              -- Edad (age as string to preserve original)
    nombre_completo TEXT NOT NULL,          -- Nombre completo (main name field)
    
    -- Status & Progress (for app functionality)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'elementary', 'intermediate', 'advanced')),
    progress INTEGER DEFAULT 0,
    current_stage INTEGER DEFAULT 1,
    
    -- Additional fields for app features
    notes TEXT,
    available_days JSONB,
    custom_protocol JSONB,
    milestones JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_new_muslims_user_id ON new_muslims(user_id);
CREATE INDEX idx_new_muslims_status ON new_muslims(status);
CREATE INDEX idx_new_muslims_nombre ON new_muslims(nombre_completo);

-- Enable Row Level Security
ALTER TABLE new_muslims ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view their own new_muslims"
    ON new_muslims FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own new_muslims"
    ON new_muslims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own new_muslims"
    ON new_muslims FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own new_muslims"
    ON new_muslims FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON new_muslims TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE new_muslims_id_seq TO authenticated;
