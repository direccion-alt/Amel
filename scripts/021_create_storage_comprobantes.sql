-- =====================================================
-- CONFIGURACIÓN DE STORAGE PARA COMPROBANTES
-- Fecha: 2026-02-05
-- Propósito: Bucket de almacenamiento para tickets/facturas de mantenimiento
-- =====================================================

-- IMPORTANTE: Este script se ejecuta en el SQL Editor de Supabase
-- Pero el bucket se debe crear desde la interfaz de Storage primero

-- ============ CREAR BUCKET (vía SQL - requiere permisos de superusuario) ============
-- Si tienes permisos, ejecuta esto:
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-mantenimiento', 'comprobantes-mantenimiento', false);
*/

-- ============ ALTERNATIVA: Crear desde UI ============
-- 1. Ve a Storage en Supabase Dashboard
-- 2. Click en "New Bucket"
-- 3. Nombre: comprobantes-mantenimiento
-- 4. Public: NO (privado, solo usuarios autenticados)
-- 5. File size limit: 10 MB
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg

-- ============ POLÍTICAS DE ACCESO (RLS) ============

-- Política 1: Usuarios autenticados pueden subir archivos
CREATE POLICY "Permitir upload de comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes-mantenimiento');

-- Política 2: Usuarios autenticados pueden leer archivos
CREATE POLICY "Permitir lectura de comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprobantes-mantenimiento');

-- Política 3: Usuarios autenticados pueden actualizar (reemplazar archivos)
CREATE POLICY "Permitir actualización de comprobantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'comprobantes-mantenimiento');

-- Política 4: Usuarios autenticados pueden eliminar
CREATE POLICY "Permitir eliminación de comprobantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprobantes-mantenimiento');

-- ============ OPCIONAL: Política más restrictiva ============
-- Solo permitir lectura pública si quieres que sean visibles sin auth:
/*
CREATE POLICY "Permitir lectura pública de comprobantes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comprobantes-mantenimiento');
*/

-- ============ ESTRUCTURA RECOMENDADA DE CARPETAS ============
-- Los archivos se subirán con esta estructura:
-- comprobantes-mantenimiento/
--   ├── 2026/
--   │   ├── 02/  (Febrero)
--   │   │   ├── AMEL-TRAC-07_2026-02-05_FAC123.pdf
--   │   │   ├── AMEL-TRAC-12_2026-02-15_TKT456.jpg
--   │   └── 03/  (Marzo)
--   └── 2025/
--       └── 12/
--           └── AMEL-TRAC-07_2025-12-15_FAC789.pdf

-- ============ VALIDACIÓN DE TIPO DE ARCHIVO (En el cliente) ============
-- En el código TypeScript/JavaScript, validar:
-- - Tipos permitidos: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
-- - Tamaño máximo: 10 MB (10485760 bytes)

-- ============ EJEMPLO DE URL GENERADA ============
-- Después de subir, la URL será algo como:
-- https://hgkzcdmagdtjgxaniswr.supabase.co/storage/v1/object/public/comprobantes-mantenimiento/2026/02/AMEL-TRAC-07_2026-02-05_FAC123.pdf

-- ============ FUNCIONES HELPER PARA GENERAR RUTAS ============

-- Función: Generar nombre de archivo único
CREATE OR REPLACE FUNCTION generar_nombre_comprobante(
  p_economico TEXT,
  p_fecha DATE,
  p_folio TEXT,
  p_extension TEXT
) RETURNS TEXT AS $$
DECLARE
  anio TEXT;
  mes TEXT;
  timestamp_str TEXT;
BEGIN
  anio := EXTRACT(YEAR FROM p_fecha)::TEXT;
  mes := LPAD(EXTRACT(MONTH FROM p_fecha)::TEXT, 2, '0');
  timestamp_str := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
  
  RETURN anio || '/' || mes || '/' || p_economico || '_' || timestamp_str || '_' || COALESCE(p_folio, 'SIN_FOLIO') || '.' || p_extension;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT generar_nombre_comprobante('AMEL-TRAC-07', '2026-02-05', 'FAC123', 'pdf');
-- Resultado: 2026/02/AMEL-TRAC-07_20260205_143022_FAC123.pdf

-- ============ NOTAS IMPORTANTES ============
-- 1. Los comprobantes se almacenan de forma privada por defecto
-- 2. Para acceder, se necesita un token de autenticación
-- 3. En el dashboard, usar supabase.storage.from('comprobantes-mantenimiento').download()
-- 4. Para URLs públicas temporales, usar createSignedUrl() con expiración
-- 5. Implementar limpieza automática de archivos huérfanos (sin registro en tabla)

-- ============ FIN DEL SCRIPT ============
