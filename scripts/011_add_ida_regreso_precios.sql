-- Agregar columnas de IDA y REGRESO a casetas_catalogo
ALTER TABLE public.casetas_catalogo
ADD COLUMN IF NOT EXISTS precio_tracto_ida DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_tracto_regreso DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_sencillo_ida DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_sencillo_regreso DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_full_ida DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_full_regreso DECIMAL(10, 2) DEFAULT 0;

-- Agregar campo tipo_viaje a rutas_operativas (IDA o REGRESO)
ALTER TABLE public.rutas_operativas
ADD COLUMN IF NOT EXISTS tipo_viaje TEXT DEFAULT 'IDA';

-- Actualizar registros existentes para usar precio original en IDA
UPDATE public.casetas_catalogo
SET 
  precio_tracto_ida = COALESCE(precio_tracto, 0),
  precio_tracto_regreso = COALESCE(precio_tracto, 0),
  precio_sencillo_ida = COALESCE(precio_sencillo, 0),
  precio_sencillo_regreso = COALESCE(precio_sencillo, 0),
  precio_full_ida = COALESCE(precio_full, 0),
  precio_full_regreso = COALESCE(precio_full, 0);

-- Hacer las columnas antiguas opcionales (nullable) para evitar errores al crear nuevas casetas
ALTER TABLE public.casetas_catalogo
ALTER COLUMN precio_tracto DROP NOT NULL,
ALTER COLUMN precio_sencillo DROP NOT NULL,
ALTER COLUMN precio_full DROP NOT NULL;

-- Modificar función calcular_total_casetas para considerar tipo_viaje
CREATE OR REPLACE FUNCTION calcular_total_casetas(ruta_uuid UUID, modalidad_ruta TEXT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2) := 0;
  tipo_viaje_ruta TEXT;
BEGIN
  -- Obtener tipo de viaje de la ruta
  SELECT tipo_viaje INTO tipo_viaje_ruta
  FROM public.rutas_operativas
  WHERE id = ruta_uuid;
  
  -- Usar precio_aplicado si existe, sino calcular del catálogo activo
  SELECT COALESCE(SUM(
    CASE 
      WHEN rc.precio_aplicado > 0 THEN rc.precio_aplicado * rc.cantidad
      WHEN modalidad_ruta = 'TRACTO' AND tipo_viaje_ruta = 'IDA' THEN cc.precio_tracto_ida * rc.cantidad
      WHEN modalidad_ruta = 'TRACTO' AND tipo_viaje_ruta = 'REGRESO' THEN cc.precio_tracto_regreso * rc.cantidad
      WHEN modalidad_ruta = 'SENCILLO' AND tipo_viaje_ruta = 'IDA' THEN cc.precio_sencillo_ida * rc.cantidad
      WHEN modalidad_ruta = 'SENCILLO' AND tipo_viaje_ruta = 'REGRESO' THEN cc.precio_sencillo_regreso * rc.cantidad
      WHEN modalidad_ruta = 'FULL' AND tipo_viaje_ruta = 'IDA' THEN cc.precio_full_ida * rc.cantidad
      WHEN modalidad_ruta = 'FULL' AND tipo_viaje_ruta = 'REGRESO' THEN cc.precio_full_regreso * rc.cantidad
      ELSE 0
    END
  ), 0)
  INTO total
  FROM public.ruta_casetas rc
  JOIN public.casetas_catalogo cc ON rc.caseta_id = cc.id
  WHERE rc.ruta_id = ruta_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger guardar_precio_aplicado para considerar tipo_viaje
CREATE OR REPLACE FUNCTION guardar_precio_aplicado()
RETURNS TRIGGER AS $$
DECLARE
  modalidad_ruta TEXT;
  tipo_viaje_ruta TEXT;
  precio_actual DECIMAL(10, 2);
BEGIN
  -- Obtener modalidad y tipo de viaje de la ruta
  SELECT modalidad, tipo_viaje INTO modalidad_ruta, tipo_viaje_ruta
  FROM public.rutas_operativas
  WHERE id = NEW.ruta_id;
  
  -- Obtener precio actual de la caseta activa según modalidad y tipo de viaje
  SELECT 
    CASE 
      WHEN modalidad_ruta = 'TRACTO' AND tipo_viaje_ruta = 'IDA' THEN precio_tracto_ida
      WHEN modalidad_ruta = 'TRACTO' AND tipo_viaje_ruta = 'REGRESO' THEN precio_tracto_regreso
      WHEN modalidad_ruta = 'SENCILLO' AND tipo_viaje_ruta = 'IDA' THEN precio_sencillo_ida
      WHEN modalidad_ruta = 'SENCILLO' AND tipo_viaje_ruta = 'REGRESO' THEN precio_sencillo_regreso
      WHEN modalidad_ruta = 'FULL' AND tipo_viaje_ruta = 'IDA' THEN precio_full_ida
      WHEN modalidad_ruta = 'FULL' AND tipo_viaje_ruta = 'REGRESO' THEN precio_full_regreso
      ELSE 0
    END
  INTO precio_actual
  FROM public.casetas_catalogo
  WHERE id = NEW.caseta_id AND activo = true
  LIMIT 1;
  
  -- Guardar el precio aplicado
  NEW.precio_aplicado := precio_actual;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
