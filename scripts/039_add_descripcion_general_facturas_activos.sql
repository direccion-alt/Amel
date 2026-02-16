-- Add descripcion_general to facturas_activos

ALTER TABLE public.facturas_activos
ADD COLUMN IF NOT EXISTS descripcion_general TEXT;

CREATE INDEX IF NOT EXISTS idx_facturas_activos_descripcion_general ON public.facturas_activos(descripcion_general);
