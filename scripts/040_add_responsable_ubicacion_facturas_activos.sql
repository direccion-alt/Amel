-- Add responsable and ubicacion to facturas_activos

ALTER TABLE public.facturas_activos
ADD COLUMN IF NOT EXISTS responsable_id UUID,
ADD COLUMN IF NOT EXISTS ubicacion TEXT;

CREATE INDEX IF NOT EXISTS idx_facturas_activos_responsable_id ON public.facturas_activos(responsable_id);
CREATE INDEX IF NOT EXISTS idx_facturas_activos_ubicacion ON public.facturas_activos(ubicacion);
