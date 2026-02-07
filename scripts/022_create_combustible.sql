-- =====================================================
-- CREAR TABLA DE COMBUSTIBLE - CONTROL DE DIESEL
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 0. ELIMINAR TABLA ANTERIOR (si existe)
DROP TABLE IF EXISTS combustible CASCADE;

-- 1. CREAR TABLA COMBUSTIBLE
CREATE TABLE IF NOT EXISTS combustible (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  economico TEXT NOT NULL,
  fecha_carga DATE NOT NULL,
  litros NUMERIC NOT NULL,
  monto_pagado NUMERIC NOT NULL,
  precio_por_litro NUMERIC,
  estacion_proveedor TEXT,
  folio_ticket TEXT,
  ticket_url TEXT,
  ticket_nombre TEXT,
  ticket_size INTEGER,
  ticket_tipo TEXT,
  notas TEXT,
  usuario_registro TEXT DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR ÍNDICES PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_combustible_economico ON combustible(economico);
CREATE INDEX IF NOT EXISTS idx_combustible_fecha ON combustible(fecha_carga DESC);
CREATE INDEX IF NOT EXISTS idx_combustible_estacion ON combustible(estacion_proveedor);

-- 3. HABILITAR ROW LEVEL SECURITY
ALTER TABLE combustible ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Permitir lectura de combustible" ON combustible;
CREATE POLICY "Permitir lectura de combustible"
  ON combustible FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir inserción de combustible" ON combustible;
CREATE POLICY "Permitir inserción de combustible"
  ON combustible FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualización de combustible" ON combustible;
CREATE POLICY "Permitir actualización de combustible"
  ON combustible FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir eliminación de combustible" ON combustible;
CREATE POLICY "Permitir eliminación de combustible"
  ON combustible FOR DELETE
  USING (true);

-- =====================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que funciona
-- =====================================================
SELECT COUNT(*) as total_cargas_combustible FROM combustible;
