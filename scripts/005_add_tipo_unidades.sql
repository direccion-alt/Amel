-- Agrega tipo a unidades para identificar TRAC/PORT/PLAT/DOL
ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Valores permitidos (opcional: se puede validar con CHECK)
-- ALTER TABLE public.unidades
-- ADD CONSTRAINT unidades_tipo_check CHECK (tipo IN ('TRAC','PORT','PLAT','DOL'));

-- Valor por defecto (opcional)
-- ALTER TABLE public.unidades ALTER COLUMN tipo SET DEFAULT 'TRAC';
