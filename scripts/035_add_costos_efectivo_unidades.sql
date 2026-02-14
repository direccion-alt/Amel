-- Agregar costos en efectivo para unidades (ROI real)

ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS costo_efectivo NUMERIC;

CREATE INDEX IF NOT EXISTS idx_unidades_costo_efectivo ON public.unidades(costo_efectivo);
