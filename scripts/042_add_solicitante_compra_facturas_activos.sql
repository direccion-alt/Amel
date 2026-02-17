-- Add solicitante_compra to facturas_activos

ALTER TABLE public.facturas_activos
ADD COLUMN IF NOT EXISTS solicitante_compra TEXT;

CREATE INDEX IF NOT EXISTS idx_facturas_activos_solicitante_compra
ON public.facturas_activos(solicitante_compra);
