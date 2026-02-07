-- Hacer tipo_licencia opcional
ALTER TABLE public.operadores
ALTER COLUMN tipo_licencia DROP NOT NULL;

-- Si hay valores vacíos, pasarlos a NULL
UPDATE public.operadores
SET tipo_licencia = NULL
WHERE tipo_licencia = '';
