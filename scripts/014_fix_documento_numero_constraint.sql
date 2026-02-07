-- Eliminar todas las restricciones UNIQUE en documento_numero
ALTER TABLE public.operadores 
DROP CONSTRAINT IF EXISTS operadores_documento_numero_key;

-- Eliminar índice UNIQUE si existe
DROP INDEX IF EXISTS public.operadores_documento_numero_unique;

-- Actualizar valores vacíos existentes a NULL
UPDATE public.operadores
SET documento_numero = NULL
WHERE documento_numero = '' OR documento_numero IS NULL;

-- NO crear restricción UNIQUE - documento_numero es opcional y puede repetirse
