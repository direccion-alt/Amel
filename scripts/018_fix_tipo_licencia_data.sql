-- Limpiar datos existentes antes de aplicar check constraint
-- Convertir valores no válidos a NULL
UPDATE public.operadores
SET tipo_licencia = NULL
WHERE tipo_licencia IS NOT NULL
  AND tipo_licencia NOT IN (
    'A - SCT',
    'B - SCT',
    'C - SCT',
    'D - SCT',
    'E - SCT',
    'F - SCT'
  );

-- Reaplicar el check constraint
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
