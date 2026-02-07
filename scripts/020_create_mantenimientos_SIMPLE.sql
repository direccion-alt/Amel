-- =====================================================
-- CREAR TABLA DE MANTENIMIENTOS - VERSIÓN SIMPLIFICADA
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 0. ELIMINAR TABLA ANTERIOR (si existe)
DROP TABLE IF EXISTS mantenimientos CASCADE;

-- 1. CREAR TABLA MANTENIMIENTOS
CREATE TABLE IF NOT EXISTS mantenimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  economico TEXT NOT NULL,
  tipo_unidad TEXT DEFAULT 'TRACTO',
  fecha_servicio DATE NOT NULL,
  tipo_mantenimiento TEXT NOT NULL DEFAULT 'CORRECTIVO',
  categoria TEXT NOT NULL DEFAULT 'OTRO',
  km_actual NUMERIC NOT NULL,
  km_proximo_servicio NUMERIC,
  descripcion TEXT NOT NULL,
  sintomas TEXT,
  diagnostico TEXT,
  proveedor TEXT NOT NULL,
  direccion_proveedor TEXT,
  telefono_proveedor TEXT,
  folio_ticket TEXT,
  monto_refacciones NUMERIC DEFAULT 0,
  monto_mano_obra NUMERIC DEFAULT 0,
  monto_otros NUMERIC DEFAULT 0,
  monto_total NUMERIC DEFAULT 0,
  comprobante_url TEXT,
  comprobante_nombre TEXT,
  comprobante_size INTEGER,
  comprobante_tipo TEXT,
  en_garantia BOOLEAN DEFAULT FALSE,
  fecha_fin_garantia DATE,
  requiere_seguimiento BOOLEAN DEFAULT FALSE,
  fecha_seguimiento DATE,
  notas TEXT,
  estatus TEXT DEFAULT 'COMPLETADO',
  usuario_registro TEXT DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR ÍNDICES PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_mantenimientos_economico ON mantenimientos(economico);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha ON mantenimientos(fecha_servicio DESC);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_categoria ON mantenimientos(categoria);

-- 3. HABILITAR ROW LEVEL SECURITY
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Permitir lectura de mantenimientos" ON mantenimientos;
CREATE POLICY "Permitir lectura de mantenimientos"
  ON mantenimientos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir inserción de mantenimientos" ON mantenimientos;
CREATE POLICY "Permitir inserción de mantenimientos"
  ON mantenimientos FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualización de mantenimientos" ON mantenimientos;
CREATE POLICY "Permitir actualización de mantenimientos"
  ON mantenimientos FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir eliminación de mantenimientos" ON mantenimientos;
CREATE POLICY "Permitir eliminación de mantenimientos"
  ON mantenimientos FOR DELETE
  USING (true);

-- =====================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que funciona
-- =====================================================
SELECT COUNT(*) as total_mantenimientos FROM mantenimientos;
