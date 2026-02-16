-- Create assets (equipo y activo) and movement history

CREATE TABLE IF NOT EXISTS public.activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT,
  unidad_medida TEXT,
  cantidad_total NUMERIC NOT NULL DEFAULT 0,
  cantidad_disponible NUMERIC NOT NULL DEFAULT 0,
  costo_unitario NUMERIC,
  ubicacion_actual TEXT,
  responsable_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
  unidad_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.movimientos_activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id UUID NOT NULL REFERENCES public.activos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'DEVOLUCION', 'TRASLADO', 'AJUSTE')),
  cantidad NUMERIC NOT NULL DEFAULT 0,
  responsable_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
  unidad_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  ubicacion TEXT,
  responsiva_url TEXT,
  notas TEXT,
  fecha_movimiento DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activos_nombre ON public.activos(nombre);
CREATE INDEX IF NOT EXISTS idx_activos_categoria ON public.activos(categoria);
CREATE INDEX IF NOT EXISTS idx_mov_activo ON public.movimientos_activos(activo_id);
CREATE INDEX IF NOT EXISTS idx_mov_responsable ON public.movimientos_activos(responsable_id);
CREATE INDEX IF NOT EXISTS idx_mov_unidad ON public.movimientos_activos(unidad_id);
CREATE INDEX IF NOT EXISTS idx_mov_fecha ON public.movimientos_activos(fecha_movimiento);

ALTER TABLE public.activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_activos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activos read anon" ON public.activos
  FOR SELECT TO anon USING (true);
CREATE POLICY "Activos read auth" ON public.activos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activos write anon" ON public.activos
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Activos write auth" ON public.activos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Activos update anon" ON public.activos
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Activos update auth" ON public.activos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Activos delete anon" ON public.activos
  FOR DELETE TO anon USING (true);
CREATE POLICY "Activos delete auth" ON public.activos
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Movimientos read anon" ON public.movimientos_activos
  FOR SELECT TO anon USING (true);
CREATE POLICY "Movimientos read auth" ON public.movimientos_activos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Movimientos write anon" ON public.movimientos_activos
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Movimientos write auth" ON public.movimientos_activos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Movimientos update anon" ON public.movimientos_activos
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Movimientos update auth" ON public.movimientos_activos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Movimientos delete anon" ON public.movimientos_activos
  FOR DELETE TO anon USING (true);
CREATE POLICY "Movimientos delete auth" ON public.movimientos_activos
  FOR DELETE TO authenticated USING (true);
