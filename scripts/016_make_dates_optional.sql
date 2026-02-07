-- Hacer que fecha_contratacion y vigencia_contrato sean opcionales
ALTER TABLE public.operadores 
ALTER COLUMN fecha_contratacion DROP NOT NULL;

-- vigencia_contrato ya debería ser NULL por el script 012, pero confirmamos
ALTER TABLE public.operadores 
ALTER COLUMN vigencia_contrato DROP NOT NULL;

-- También hacer opcionales otros campos de fechas
ALTER TABLE public.operadores 
ALTER COLUMN licencia_vigencia DROP NOT NULL;
