-- Verificar y corregir políticas RLS en operadores
-- Primero, eliminar las políticas existentes si las hay
DROP POLICY IF EXISTS "Enable read for all users" ON public.operadores;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.operadores;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.operadores;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.operadores;

-- Habilitar RLS
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas
CREATE POLICY "Enable read for all users" ON public.operadores
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.operadores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.operadores
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.operadores
  FOR DELETE USING (true);
