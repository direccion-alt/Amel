-- Agregar columna total_casetas a rutas_operativas
ALTER TABLE public.rutas_operativas
ADD COLUMN total_casetas DECIMAL(10, 2) DEFAULT 0;

-- Función para calcular el total de casetas de una ruta
CREATE OR REPLACE FUNCTION calcular_total_casetas(ruta_uuid UUID, modalidad_ruta TEXT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
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

-- Trigger para actualizar total_casetas cuando se insertan/actualizan/eliminan casetas
CREATE OR REPLACE FUNCTION actualizar_total_casetas()
RETURNS TRIGGER AS $$
DECLARE
  modalidad_ruta TEXT;
BEGIN
  -- Obtener la modalidad de la ruta
  SELECT modalidad INTO modalidad_ruta
  FROM public.rutas_operativas
  WHERE id = COALESCE(NEW.ruta_id, OLD.ruta_id);
  
  -- Actualizar el total en rutas_operativas
  UPDATE public.rutas_operativas
  SET total_casetas = calcular_total_casetas(COALESCE(NEW.ruta_id, OLD.ruta_id), modalidad_ruta)
  WHERE id = COALESCE(NEW.ruta_id, OLD.ruta_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT, UPDATE y DELETE en ruta_casetas
DROP TRIGGER IF EXISTS trigger_actualizar_total_casetas ON public.ruta_casetas;
CREATE TRIGGER trigger_actualizar_total_casetas
AFTER INSERT OR UPDATE OR DELETE ON public.ruta_casetas
FOR EACH ROW
EXECUTE FUNCTION actualizar_total_casetas();

-- Trigger adicional: actualizar total cuando cambia la modalidad de la ruta
CREATE OR REPLACE FUNCTION actualizar_total_casetas_por_modalidad()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió la modalidad, recalcular el total
  IF OLD.modalidad IS DISTINCT FROM NEW.modalidad THEN
    NEW.total_casetas := calcular_total_casetas(NEW.id, NEW.modalidad);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_total_por_modalidad ON public.rutas_operativas;
CREATE TRIGGER trigger_actualizar_total_por_modalidad
BEFORE UPDATE ON public.rutas_operativas
FOR EACH ROW
EXECUTE FUNCTION actualizar_total_casetas_por_modalidad();

-- Trigger adicional: actualizar total cuando cambian los precios en el catálogo
CREATE OR REPLACE FUNCTION actualizar_total_casetas_por_precio()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todas las rutas que usan esta caseta
  UPDATE public.rutas_operativas ro
  SET total_casetas = calcular_total_casetas(ro.id, ro.modalidad)
  FROM public.ruta_casetas rc
  WHERE rc.caseta_id = NEW.id AND rc.ruta_id = ro.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_total_por_precio ON public.casetas_catalogo;
CREATE TRIGGER trigger_actualizar_total_por_precio
AFTER UPDATE ON public.casetas_catalogo
FOR EACH ROW
WHEN (
  OLD.precio_tracto IS DISTINCT FROM NEW.precio_tracto OR
  OLD.precio_sencillo IS DISTINCT FROM NEW.precio_sencillo OR
  OLD.precio_full IS DISTINCT FROM NEW.precio_full
)
EXECUTE FUNCTION actualizar_total_casetas_por_precio();

-- Inicializar total_casetas para rutas existentes
UPDATE public.rutas_operativas
SET total_casetas = calcular_total_casetas(id, modalidad);
