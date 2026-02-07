-- =====================================================
-- AGREGAR CAMPO DE COSTO TOTAL A UNIDADES
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR COLUMNA DE COSTO TOTAL
ALTER TABLE IF EXISTS unidades ADD COLUMN costo_total NUMERIC;

-- 2. AGREGAR COLUMNA DE FECHA DE COMPRA (PARA DEPRECIATION)
ALTER TABLE IF EXISTS unidades ADD COLUMN fecha_compra DATE;

-- 3. CREAR ÍNDICE PARA BÚSQUEDAS
CREATE INDEX IF NOT EXISTS idx_unidades_costo ON unidades(costo_total);

-- =====================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que funciona
-- =====================================================
SELECT economico, placas, costo_total, fecha_compra FROM unidades LIMIT 5;
