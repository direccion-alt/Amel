-- Crear tabla de rutas operativas
CREATE TABLE IF NOT EXISTS public.rutas_operativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  modalidad TEXT NOT NULL, -- SECO, REFRIGERADO, PELIGROSO, etc.
  estado_carga TEXT NOT NULL, -- COMPLETO, MEDIO, VACIO
  costo_ruta DECIMAL(10, 2) NOT NULL,
  casetas DECIMAL(10, 2) DEFAULT 0,
  pago_operador DECIMAL(10, 2) NOT NULL,
  estatus TEXT DEFAULT 'Activo', -- Activo, Inactivo
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_rutas_operativas_estatus ON public.rutas_operativas(estatus);
CREATE INDEX IF NOT EXISTS idx_rutas_operativas_origen_destino ON public.rutas_operativas(origen, destino);

-- Habilitar RLS
ALTER TABLE public.rutas_operativas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rutas_operativas;
CREATE POLICY "Enable read access for all users" ON public.rutas_operativas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rutas_operativas;
CREATE POLICY "Enable insert for authenticated users" ON public.rutas_operativas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.rutas_operativas;
CREATE POLICY "Enable update for authenticated users" ON public.rutas_operativas
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.rutas_operativas;
CREATE POLICY "Enable delete for authenticated users" ON public.rutas_operativas
  FOR DELETE USING (true);
