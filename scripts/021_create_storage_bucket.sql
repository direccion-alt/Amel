-- =====================================================
-- CREAR BUCKET EN SUPABASE STORAGE
-- =====================================================
-- INSTRUCCIONES:
-- Este script crea el bucket para guardar comprobantes.
-- NO se ejecuta en SQL Editor, sino en la CLI de Supabase
-- O créalo manualmente desde el Dashboard: Storage → New Bucket

-- ALTERNATIVA 1: Por CLI (recomendado)
-- supabase storage create-bucket comprobantes-mantenimiento

-- ALTERNATIVA 2: Por Dashboard Supabase
-- 1. Ve a https://supabase.com/dashboard
-- 2. Selecciona tu proyecto
-- 3. Ve a Storage → New Bucket
-- 4. Nombre: comprobantes-mantenimiento
-- 5. Visibilidad: Private
-- 6. Click "Create bucket"

-- =====================================================
-- CONFIGURAR PERMISOS (RLS) - EJECUTA ESTO EN SQL EDITOR
-- =====================================================

-- Permitir lectura de comprobantes
DROP POLICY IF EXISTS "Permitir lectura de comprobantes" ON storage.objects;
CREATE POLICY "Permitir lectura de comprobantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes-mantenimiento');

-- Permitir subir comprobantes
DROP POLICY IF EXISTS "Permitir subir comprobantes" ON storage.objects;
CREATE POLICY "Permitir subir comprobantes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprobantes-mantenimiento');

-- Permitir eliminar comprobantes propios
DROP POLICY IF EXISTS "Permitir eliminar comprobantes" ON storage.objects;
CREATE POLICY "Permitir eliminar comprobantes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comprobantes-mantenimiento');
