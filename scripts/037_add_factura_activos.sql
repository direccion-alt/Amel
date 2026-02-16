-- Add purchase invoice fields for activos

ALTER TABLE public.activos
ADD COLUMN IF NOT EXISTS compra_subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS compra_iva NUMERIC,
ADD COLUMN IF NOT EXISTS compra_total NUMERIC,
ADD COLUMN IF NOT EXISTS proveedor_compra TEXT,
ADD COLUMN IF NOT EXISTS fecha_compra DATE,
ADD COLUMN IF NOT EXISTS factura_url TEXT,
ADD COLUMN IF NOT EXISTS compra_descripcion TEXT;

CREATE INDEX IF NOT EXISTS idx_activos_proveedor_compra ON public.activos(proveedor_compra);
CREATE INDEX IF NOT EXISTS idx_activos_fecha_compra ON public.activos(fecha_compra);
