-- Agregar desglose de costo para ROI en unidades
-- Incluye subtotal e IVA para calcular total

ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS costo_subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS costo_iva NUMERIC;

CREATE INDEX IF NOT EXISTS idx_unidades_costo_subtotal ON public.unidades(costo_subtotal);
CREATE INDEX IF NOT EXISTS idx_unidades_costo_iva ON public.unidades(costo_iva);
