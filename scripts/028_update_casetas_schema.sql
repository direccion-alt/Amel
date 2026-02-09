-- Create or update casetas schema to persist data in Supabase

-- Catalogo de casetas (versioned precios + historial)
CREATE TABLE IF NOT EXISTS public.casetas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio_tracto DECIMAL(10, 2) DEFAULT 0,
  precio_sencillo DECIMAL(10, 2) DEFAULT 0,
  precio_full DECIMAL(10, 2) DEFAULT 0,
  precio_tracto_ida DECIMAL(10, 2) DEFAULT 0,
  precio_tracto_regreso DECIMAL(10, 2) DEFAULT 0,
  precio_sencillo_ida DECIMAL(10, 2) DEFAULT 0,
  precio_sencillo_regreso DECIMAL(10, 2) DEFAULT 0,
  precio_full_ida DECIMAL(10, 2) DEFAULT 0,
  precio_full_regreso DECIMAL(10, 2) DEFAULT 0,
  estatus TEXT DEFAULT 'Activo',
  activo BOOLEAN DEFAULT TRUE,
  fecha_vigencia DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.casetas_catalogo
  ADD COLUMN IF NOT EXISTS precio_tracto_ida DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_tracto_regreso DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_sencillo_ida DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_sencillo_regreso DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_full_ida DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_full_regreso DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fecha_vigencia DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE public.casetas_catalogo
  ALTER COLUMN precio_tracto SET DEFAULT 0,
  ALTER COLUMN precio_sencillo SET DEFAULT 0,
  ALTER COLUMN precio_full SET DEFAULT 0;

-- Completar campos nuevos con valores base si estan vacios
UPDATE public.casetas_catalogo
SET
  precio_tracto_ida = COALESCE(precio_tracto_ida, precio_tracto, 0),
  precio_tracto_regreso = COALESCE(precio_tracto_regreso, precio_tracto, 0),
  precio_sencillo_ida = COALESCE(precio_sencillo_ida, precio_sencillo, 0),
  precio_sencillo_regreso = COALESCE(precio_sencillo_regreso, precio_sencillo, 0),
  precio_full_ida = COALESCE(precio_full_ida, precio_full, 0),
  precio_full_regreso = COALESCE(precio_full_regreso, precio_full, 0),
  activo = COALESCE(activo, TRUE),
  fecha_vigencia = COALESCE(fecha_vigencia, CURRENT_DATE)
WHERE
  precio_tracto_ida IS NULL
  OR precio_tracto_regreso IS NULL
  OR precio_sencillo_ida IS NULL
  OR precio_sencillo_regreso IS NULL
  OR precio_full_ida IS NULL
  OR precio_full_regreso IS NULL
  OR activo IS NULL
  OR fecha_vigencia IS NULL;

-- Casetas asignadas por ruta
CREATE TABLE IF NOT EXISTS public.ruta_casetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES public.rutas_operativas(id) ON DELETE CASCADE,
  caseta_id UUID NOT NULL REFERENCES public.casetas_catalogo(id) ON DELETE RESTRICT,
  orden INT NOT NULL DEFAULT 1,
  cantidad INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.ruta_casetas
  ADD COLUMN IF NOT EXISTS orden INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cantidad INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_ruta_casetas_ruta ON public.ruta_casetas(ruta_id);
CREATE INDEX IF NOT EXISTS idx_ruta_casetas_caseta ON public.ruta_casetas(caseta_id);

ALTER TABLE public.casetas_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruta_casetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.casetas_catalogo;
CREATE POLICY "Enable read access for all users" ON public.casetas_catalogo
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.casetas_catalogo;
CREATE POLICY "Enable insert for authenticated users" ON public.casetas_catalogo
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.casetas_catalogo;
CREATE POLICY "Enable update for authenticated users" ON public.casetas_catalogo
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.casetas_catalogo;
CREATE POLICY "Enable delete for authenticated users" ON public.casetas_catalogo
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.ruta_casetas;
CREATE POLICY "Enable read access for all users" ON public.ruta_casetas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ruta_casetas;
CREATE POLICY "Enable insert for authenticated users" ON public.ruta_casetas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.ruta_casetas;
CREATE POLICY "Enable update for authenticated users" ON public.ruta_casetas
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.ruta_casetas;
CREATE POLICY "Enable delete for authenticated users" ON public.ruta_casetas
  FOR DELETE USING (true);
