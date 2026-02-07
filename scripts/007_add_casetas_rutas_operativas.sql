-- Agregar columna casetas a rutas_operativas si no existe
ALTER TABLE public.rutas_operativas
ADD COLUMN IF NOT EXISTS casetas DECIMAL(10, 2) DEFAULT 0;
