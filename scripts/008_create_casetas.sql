-- Catálogo de casetas
CREATE TABLE IF NOT EXISTS public.casetas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio_tracto DECIMAL(10, 2) NOT NULL,
  precio_sencillo DECIMAL(10, 2) NOT NULL,
  precio_full DECIMAL(10, 2) NOT NULL,
  estatus TEXT DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Casetas asignadas por ruta
CREATE TABLE IF NOT EXISTS public.ruta_casetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES public.rutas_operativas(id) ON DELETE CASCADE,
  caseta_id UUID NOT NULL REFERENCES public.casetas_catalogo(id) ON DELETE RESTRICT,
  orden INT NOT NULL DEFAULT 1,
  cantidad INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

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
