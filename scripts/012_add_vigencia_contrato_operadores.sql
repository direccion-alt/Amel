-- Agregar columna de vigencia_contrato si no existe
ALTER TABLE public.operadores
ADD COLUMN IF NOT EXISTS vigencia_contrato DATE;

-- Crear índice para buscar por vigencia
CREATE INDEX IF NOT EXISTS idx_operadores_vigencia ON public.operadores(vigencia_contrato);
