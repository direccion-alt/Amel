-- Agregar versionamiento a casetas_catalogo
ALTER TABLE public.casetas_catalogo
ADD COLUMN fecha_vigencia DATE DEFAULT CURRENT_DATE,
ADD COLUMN activo BOOLEAN DEFAULT true;

-- Agregar precio_aplicado a ruta_casetas (snapshot del precio al momento de asignar)
ALTER TABLE public.ruta_casetas
ADD COLUMN precio_aplicado DECIMAL(10, 2) DEFAULT 0;

-- Índice para buscar casetas activas
CREATE INDEX IF NOT EXISTS idx_casetas_catalogo_activo ON public.casetas_catalogo(activo, nombre);

-- Actualizar registros existentes como activos y con fecha actual
UPDATE public.casetas_catalogo
SET activo = true, fecha_vigencia = CURRENT_DATE
WHERE activo IS NULL;

-- Actualizar ruta_casetas existentes con el precio actual aplicado
UPDATE public.ruta_casetas rc
SET precio_aplicado = (
  SELECT 
    CASE 
      WHEN ro.modalidad = 'TRACTO' THEN cc.precio_tracto
      WHEN ro.modalidad = 'SENCILLO' THEN cc.precio_sencillo
      WHEN ro.modalidad = 'FULL' THEN cc.precio_full
      ELSE 0
    END
  FROM public.rutas_operativas ro
  JOIN public.casetas_catalogo cc ON cc.id = rc.caseta_id
  WHERE ro.id = rc.ruta_id
)
WHERE precio_aplicado = 0 OR precio_aplicado IS NULL;

-- Modificar función calcular_total_casetas para usar precio_aplicado
CREATE OR REPLACE FUNCTION calcular_total_casetas(ruta_uuid UUID, modalidad_ruta TEXT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2) := 0;
BEGIN
  -- Usar precio_aplicado si existe, sino calcular del catálogo activo
  SELECT COALESCE(SUM(
    CASE 
      WHEN rc.precio_aplicado > 0 THEN rc.precio_aplicado * rc.cantidad
      WHEN modalidad_ruta = 'TRACTO' THEN cc.precio_tracto * rc.cantidad
      WHEN modalidad_ruta = 'SENCILLO' THEN cc.precio_sencillo * rc.cantidad
      WHEN modalidad_ruta = 'FULL' THEN cc.precio_full * rc.cantidad
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

-- Trigger para guardar precio_aplicado automáticamente al insertar/actualizar ruta_casetas
CREATE OR REPLACE FUNCTION guardar_precio_aplicado()
RETURNS TRIGGER AS $$
DECLARE
  modalidad_ruta TEXT;
  precio_actual DECIMAL(10, 2);
BEGIN
  -- Obtener modalidad de la ruta
  SELECT modalidad INTO modalidad_ruta
  FROM public.rutas_operativas
  WHERE id = NEW.ruta_id;
  
  -- Obtener precio actual de la caseta activa según modalidad
  SELECT 
    CASE 
      WHEN modalidad_ruta = 'TRACTO' THEN precio_tracto
      WHEN modalidad_ruta = 'SENCILLO' THEN precio_sencillo
      WHEN modalidad_ruta = 'FULL' THEN precio_full
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

DROP TRIGGER IF EXISTS trigger_guardar_precio_aplicado ON public.ruta_casetas;
CREATE TRIGGER trigger_guardar_precio_aplicado
BEFORE INSERT OR UPDATE ON public.ruta_casetas
FOR EACH ROW
EXECUTE FUNCTION guardar_precio_aplicado();
