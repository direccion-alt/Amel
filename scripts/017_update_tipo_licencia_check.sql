-- Actualizar check constraint de tipo_licencia para categorías SICT
ALTER TABLE public.operadores
DROP CONSTRAINT IF EXISTS operadores_tipo_licencia_check;

ALTER TABLE public.operadores
ADD CONSTRAINT operadores_tipo_licencia_check CHECK (
  tipo_licencia IS NULL OR tipo_licencia IN (
    'A - SCT',
    'B - SCT',
    'C - SCT',
    'D - SCT',
    'E - SCT',
    'F - SCT'
  )
);
