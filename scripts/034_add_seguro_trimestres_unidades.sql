-- Crear tabla para registrar pagos de seguro trimestrales de unidades

CREATE TABLE IF NOT EXISTS public.pagos_seguro_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  fecha_pago DATE NOT NULL,
  concepto TEXT, -- ej: "Pago completo Q1 2025", "Pago proporcional - unidad nueva"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_seguro_unidad ON public.pagos_seguro_unidades(unidad_id);
CREATE INDEX IF NOT EXISTS idx_pagos_seguro_fecha ON public.pagos_seguro_unidades(fecha_pago);

-- RLS policies
ALTER TABLE public.pagos_seguro_unidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios anonimos pueden ver pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios anonimos pueden insertar pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios anonimos pueden actualizar pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar pagos de seguro" ON public.pagos_seguro_unidades;
DROP POLICY IF EXISTS "Usuarios anonimos pueden eliminar pagos de seguro" ON public.pagos_seguro_unidades;

CREATE POLICY "Usuarios autenticados pueden ver pagos de seguro"
  ON public.pagos_seguro_unidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios anonimos pueden ver pagos de seguro"
  ON public.pagos_seguro_unidades FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar pagos de seguro"
  ON public.pagos_seguro_unidades FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios anonimos pueden insertar pagos de seguro"
  ON public.pagos_seguro_unidades FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar pagos de seguro"
  ON public.pagos_seguro_unidades FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios anonimos pueden actualizar pagos de seguro"
  ON public.pagos_seguro_unidades FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar pagos de seguro"
  ON public.pagos_seguro_unidades FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios anonimos pueden eliminar pagos de seguro"
  ON public.pagos_seguro_unidades FOR DELETE
  TO anon
  USING (true);
