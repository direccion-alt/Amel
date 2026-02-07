-- =====================================================
-- DETALLE DE PIEZAS / SERVICIOS FACTURADOS
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 1. TABLA DE PIEZAS POR MANTENIMIENTO
CREATE TABLE IF NOT EXISTS mantenimiento_piezas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mantenimiento_id UUID NOT NULL REFERENCES mantenimientos(id) ON DELETE CASCADE,
  economico TEXT NOT NULL,
  fecha_servicio DATE NOT NULL,
  pieza TEXT NOT NULL,
  cantidad NUMERIC DEFAULT 1,
  precio_unitario NUMERIC DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  iva NUMERIC GENERATED ALWAYS AS ((cantidad * precio_unitario) * 0.16) STORED,
  total_con_iva NUMERIC GENERATED ALWAYS AS ((cantidad * precio_unitario) * 1.16) STORED,
  tipo_mantenimiento TEXT NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA', 'REVISION')),
  categoria TEXT NOT NULL CHECK (categoria IN ('REFACCIONES', 'MANO DE OBRA', 'VULCANIZADORA', 'ACEITE Y FILTROS', 'SUSPENSION', 'FRENOS', 'ELECTRICO', 'OTRO')),
  proveedor TEXT,
  folio_ticket TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES PARA BÚSQUEDA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_mantenimiento_piezas_pieza ON mantenimiento_piezas(pieza);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_piezas_economico ON mantenimiento_piezas(economico);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_piezas_fecha ON mantenimiento_piezas(fecha_servicio DESC);

-- 3. ROW LEVEL SECURITY
ALTER TABLE mantenimiento_piezas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de piezas" ON mantenimiento_piezas
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de piezas" ON mantenimiento_piezas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de piezas" ON mantenimiento_piezas
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de piezas" ON mantenimiento_piezas
  FOR DELETE USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT pieza, cantidad, precio_unitario, total_con_iva FROM mantenimiento_piezas LIMIT 5;
