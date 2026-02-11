-- Crear tabla para conexiones entre tractos y equipos (portacontenedor, dolly, plataforma)

CREATE TABLE IF NOT EXISTS public.unidades_conexiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracto_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE RESTRICT,
  tipo_equipo TEXT NOT NULL, -- PORT | PLAT | DOL
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unidades_conexiones_tracto ON public.unidades_conexiones(tracto_id);
CREATE INDEX IF NOT EXISTS idx_unidades_conexiones_equipo ON public.unidades_conexiones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_unidades_conexiones_activo ON public.unidades_conexiones(activo);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unidades_conexiones_activo_unique
  ON public.unidades_conexiones(tracto_id, tipo_equipo)
  WHERE activo = true;

ALTER TABLE public.unidades_conexiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.unidades_conexiones;
CREATE POLICY "Enable read access for all users" ON public.unidades_conexiones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.unidades_conexiones;
CREATE POLICY "Enable insert for authenticated users" ON public.unidades_conexiones
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.unidades_conexiones;
CREATE POLICY "Enable update for authenticated users" ON public.unidades_conexiones
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.unidades_conexiones;
CREATE POLICY "Enable delete for authenticated users" ON public.unidades_conexiones
  FOR DELETE USING (true);
