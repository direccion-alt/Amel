-- Eliminar restricciones UNIQUE de campos opcionales que pueden estar vacíos
-- Esto permite múltiples valores NULL o vacíos

-- Email - puede estar vacío
DROP INDEX IF EXISTS public.operadores_email_unique;
ALTER TABLE public.operadores 
DROP CONSTRAINT IF EXISTS operadores_email_key;

-- Número de empleado - puede estar vacío
DROP INDEX IF EXISTS public.operadores_numero_empleado_unique;
ALTER TABLE public.operadores 
DROP CONSTRAINT IF EXISTS operadores_numero_empleado_key;

-- Número de licencia - puede estar vacío
DROP INDEX IF EXISTS public.operadores_numero_licencia_unique;
ALTER TABLE public.operadores 
DROP CONSTRAINT IF EXISTS operadores_numero_licencia_key;

-- Teléfono - puede estar vacío
DROP INDEX IF EXISTS public.operadores_telefono_unique;
ALTER TABLE public.operadores 
DROP CONSTRAINT IF EXISTS operadores_telefono_key;

-- Limpiar todos los campos vacíos a NULL para consistencia
UPDATE public.operadores
SET 
  email = NULLIF(TRIM(email), ''),
  numero_empleado = NULLIF(TRIM(numero_empleado), ''),
  numero_licencia = NULLIF(TRIM(numero_licencia), ''),
  telefono = NULLIF(TRIM(telefono), ''),
  documento_numero = NULLIF(TRIM(documento_numero), ''),
  notas = NULLIF(TRIM(notas), '');
