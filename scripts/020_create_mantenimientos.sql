-- =====================================================
-- SISTEMA DE MANTENIMIENTO AMEL
-- Fecha: 2026-02-05
-- Propósito: Control total de mantenimientos con comprobantes digitales
-- =====================================================

-- 1. TABLA PRINCIPAL: MANTENIMIENTOS
CREATE TABLE IF NOT EXISTS mantenimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- ============ RELACIÓN CON UNIDAD ============
  economico TEXT NOT NULL,
  tipo_unidad TEXT, -- 'TRACTO' | 'DOLLY' | 'CAJA'
  
  -- ============ DATOS DEL SERVICIO ============
  fecha_servicio DATE NOT NULL,
  tipo_mantenimiento TEXT NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA', 'REVISION')),
  categoria TEXT NOT NULL CHECK (categoria IN ('REFACCIONES', 'MANO DE OBRA', 'VULCANIZADORA', 'ACEITE Y FILTROS', 'SUSPENSION', 'FRENOS', 'ELECTRICO', 'OTRO')),
  
  -- ============ KILOMETRAJE Y ALERTAS ============
  km_actual NUMERIC NOT NULL, -- KM del tacómetro al momento del servicio
  km_proximo_servicio NUMERIC, -- Se calcula automáticamente (+25000 o personalizado)
  dias_proximo_servicio INTEGER DEFAULT 90, -- Alertar también por tiempo (3 meses)
  
  -- ============ DESCRIPCIÓN DETALLADA ============
  descripcion TEXT NOT NULL, -- ¿Qué se hizo? Ej: "Cambio de balatas delanteras"
  sintomas TEXT, -- ¿Por qué se hizo? Ej: "Frenado deficiente, ruido metálico"
  diagnostico TEXT, -- Diagnóstico del mecánico
  
  -- ============ PROVEEDOR Y FACTURACIÓN ============
  proveedor TEXT NOT NULL, -- Nombre del taller/proveedor
  direccion_proveedor TEXT,
  telefono_proveedor TEXT,
  folio_ticket TEXT, -- Número de ticket/factura
  
  -- ============ DESGLOSE DE COSTOS ============
  monto_refacciones NUMERIC DEFAULT 0,
  monto_mano_obra NUMERIC DEFAULT 0,
  monto_otros NUMERIC DEFAULT 0, -- Estacionamiento, grúa, etc.
  subtotal NUMERIC GENERATED ALWAYS AS (monto_refacciones + monto_mano_obra + monto_otros) STORED,
  iva NUMERIC GENERATED ALWAYS AS ((monto_refacciones + monto_mano_obra + monto_otros) * 0.16) STORED,
  monto_total NUMERIC GENERATED ALWAYS AS ((monto_refacciones + monto_mano_obra + monto_otros) * 1.16) STORED,
  
  -- ============ COMPROBANTES DIGITALES (ALMACENAMIENTO) ============
  comprobante_url TEXT, -- URL del ticket/factura en Supabase Storage
  comprobante_nombre TEXT, -- Nombre original del archivo
  comprobante_size INTEGER, -- Tamaño en bytes
  comprobante_tipo TEXT, -- 'application/pdf', 'image/jpeg', etc.
  
  -- Si se carga factura XML adicional
  factura_xml_url TEXT,
  
  -- ============ VALIDACIÓN Y APROBACIÓN ============
  requiere_aprobacion BOOLEAN DEFAULT FALSE, -- Montos >$10,000 requieren aprobación gerencial
  aprobado_por TEXT, -- Nombre de quien autorizó
  fecha_aprobacion TIMESTAMPTZ,
  estatus TEXT DEFAULT 'COMPLETADO' CHECK (estatus IN ('PENDIENTE', 'COMPLETADO', 'GARANTIA', 'RECHAZADO')),
  
  -- ============ GARANTÍA ============
  en_garantia BOOLEAN DEFAULT FALSE,
  fecha_fin_garantia DATE,
  proveedor_garantia TEXT,
  
  -- ============ NOTAS ADICIONALES ============
  notas TEXT, -- Observaciones generales
  requiere_seguimiento BOOLEAN DEFAULT FALSE, -- Marcar si necesita revisión posterior
  fecha_seguimiento DATE,
  
  -- ============ METADATOS ============
  usuario_registro TEXT, -- Quién capturó el mantenimiento
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ÍNDICES PARA PERFORMANCE ============
CREATE INDEX idx_mantenimientos_economico ON mantenimientos(economico);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha_servicio DESC);
CREATE INDEX idx_mantenimientos_categoria ON mantenimientos(categoria);
CREATE INDEX idx_mantenimientos_tipo ON mantenimientos(tipo_mantenimiento);
CREATE INDEX idx_mantenimientos_estatus ON mantenimientos(estatus);
CREATE INDEX idx_mantenimientos_km ON mantenimientos(km_actual);

-- ============ ROW LEVEL SECURITY (Opcional) ============
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer mantenimientos
CREATE POLICY "Permitir lectura de mantenimientos"
  ON mantenimientos FOR SELECT
  USING (true);

-- Política: Usuarios autenticados pueden insertar
CREATE POLICY "Permitir inserción de mantenimientos"
  ON mantenimientos FOR INSERT
  WITH CHECK (true);

-- Política: Usuarios autenticados pueden actualizar
CREATE POLICY "Permitir actualización de mantenimientos"
  ON mantenimientos FOR UPDATE
  USING (true);

-- ============ TRIGGER: Actualizar updated_at ============
CREATE OR REPLACE FUNCTION update_mantenimientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mantenimientos_updated_at
  BEFORE UPDATE ON mantenimientos
  FOR EACH ROW
  EXECUTE FUNCTION update_mantenimientos_updated_at();

-- ============ VISTA: PRÓXIMOS MANTENIMIENTOS ============
-- Esta vista muestra unidades que necesitan servicio pronto
CREATE OR REPLACE VIEW proximos_mantenimientos AS
SELECT 
  m.economico,
  m.km_actual,
  m.km_proximo_servicio,
  m.fecha_servicio AS ultimo_servicio,
  (m.km_proximo_servicio - m.km_actual) AS km_restantes,
  m.tipo_mantenimiento,
  m.categoria,
  CASE 
    WHEN (m.km_proximo_servicio - m.km_actual) <= 1000 THEN 'URGENTE'
    WHEN (m.km_proximo_servicio - m.km_actual) <= 5000 THEN 'PRÓXIMO'
    ELSE 'OK'
  END AS alerta_nivel
FROM (
  SELECT DISTINCT ON (economico)
    economico,
    km_actual,
    km_proximo_servicio,
    fecha_servicio,
    tipo_mantenimiento,
    categoria
  FROM mantenimientos
  ORDER BY economico, fecha_servicio DESC
) m
WHERE m.km_proximo_servicio IS NOT NULL
ORDER BY km_restantes ASC;

-- ============ VISTA: COSTOS POR UNIDAD ============
CREATE OR REPLACE VIEW costos_mantenimiento_por_unidad AS
SELECT 
  economico,
  COUNT(*) AS total_servicios,
  SUM(monto_refacciones) AS total_refacciones,
  SUM(monto_mano_obra) AS total_mano_obra,
  SUM(monto_total) AS total_invertido,
  AVG(monto_total) AS promedio_por_servicio,
  MAX(fecha_servicio) AS ultimo_servicio,
  MIN(fecha_servicio) AS primer_servicio
FROM mantenimientos
WHERE estatus = 'COMPLETADO'
GROUP BY economico
ORDER BY total_invertido DESC;

-- ============ COMENTARIOS PARA DOCUMENTACIÓN ============
COMMENT ON TABLE mantenimientos IS 'Registro completo de mantenimientos con comprobantes digitales y alertas por kilometraje';
COMMENT ON COLUMN mantenimientos.km_proximo_servicio IS 'Calculado automáticamente como km_actual + 25000 (o personalizado)';
COMMENT ON COLUMN mantenimientos.requiere_aprobacion IS 'TRUE para gastos mayores a $10,000 MXN';
COMMENT ON COLUMN mantenimientos.comprobante_url IS 'URL del archivo almacenado en Supabase Storage bucket "comprobantes-mantenimiento"';

-- ============ FUNCIONES HELPER ============

-- Función: Obtener historial de una unidad
CREATE OR REPLACE FUNCTION obtener_historial_mantenimiento(unidad TEXT)
RETURNS TABLE (
  fecha DATE,
  tipo TEXT,
  categoria TEXT,
  descripcion TEXT,
  monto NUMERIC,
  km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fecha_servicio,
    tipo_mantenimiento,
    categoria,
    mantenimientos.descripcion,
    monto_total,
    km_actual
  FROM mantenimientos
  WHERE economico = unidad
  ORDER BY fecha_servicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============ DATOS DE EJEMPLO (Opcional - comentar en producción) ============
/*
INSERT INTO mantenimientos (economico, tipo_unidad, fecha_servicio, tipo_mantenimiento, categoria, km_actual, km_proximo_servicio, descripcion, proveedor, monto_refacciones, monto_mano_obra, folio_ticket, estatus, usuario_registro) VALUES
('AMEL-TRAC-07', 'TRACTO', '2025-12-15', 'PREVENTIVO', 'ACEITE Y FILTROS', 145000, 170000, 'Cambio de aceite sintético 15W40 y filtros (aceite, aire, diesel)', 'TALLER GARCIA', 4500, 800, 'FAC-2025-1234', 'COMPLETADO', 'ADMIN'),
('AMEL-TRAC-12', 'TRACTO', '2026-01-10', 'CORRECTIVO', 'FRENOS', 98000, 123000, 'Cambio de balatas delanteras, rectificación de tambores', 'FRENOS RAMIREZ', 6800, 2200, 'TKT-456789', 'COMPLETADO', 'ADMIN'),
('AMEL-TRAC-07', 'TRACTO', '2026-02-01', 'EMERGENCIA', 'ELECTRICO', 147500, NULL, 'Reparación de alternador, cambio de batería', 'ELECTRO AUTO', 3200, 1500, NULL, 'COMPLETADO', 'ADMIN');
*/

-- ============ FIN DEL SCRIPT ============
-- Para ejecutar: Copiar y pegar en Supabase SQL Editor
