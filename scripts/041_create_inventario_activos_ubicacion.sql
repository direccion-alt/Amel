-- Create inventory by location for activos

CREATE TABLE IF NOT EXISTS public.inventario_activos_ubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id UUID NOT NULL REFERENCES public.activos(id) ON DELETE CASCADE,
  ubicacion TEXT NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventario_activos_ubicacion_activo
ON public.inventario_activos_ubicacion(activo_id, ubicacion);

ALTER TABLE public.inventario_activos_ubicacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read inventario activos ubicacion" ON public.inventario_activos_ubicacion;
CREATE POLICY "Public read inventario activos ubicacion"
ON public.inventario_activos_ubicacion
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public insert inventario activos ubicacion" ON public.inventario_activos_ubicacion;
CREATE POLICY "Public insert inventario activos ubicacion"
ON public.inventario_activos_ubicacion
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Public update inventario activos ubicacion" ON public.inventario_activos_ubicacion;
CREATE POLICY "Public update inventario activos ubicacion"
ON public.inventario_activos_ubicacion
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete inventario activos ubicacion" ON public.inventario_activos_ubicacion;
CREATE POLICY "Public delete inventario activos ubicacion"
ON public.inventario_activos_ubicacion
FOR DELETE
USING (true);
