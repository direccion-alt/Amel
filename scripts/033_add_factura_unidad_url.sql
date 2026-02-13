-- Agregar URL de factura de unidad para ROI

ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS factura_unidad_url TEXT;

CREATE INDEX IF NOT EXISTS idx_unidades_factura_unidad_url ON public.unidades(factura_unidad_url);
