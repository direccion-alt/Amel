-- Create purchase invoices and items for activos

CREATE TABLE IF NOT EXISTS public.facturas_activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor TEXT,
  telefono_proveedor TEXT,
  fecha_compra DATE,
  subtotal NUMERIC,
  iva NUMERIC,
  total NUMERIC,
  factura_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.facturas_activos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas_activos(id) ON DELETE CASCADE,
  categoria TEXT,
  cantidad NUMERIC,
  descripcion TEXT,
  subtotal NUMERIC,
  iva NUMERIC,
  total NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_facturas_activos_fecha ON public.facturas_activos(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_facturas_activos_proveedor ON public.facturas_activos(proveedor);
CREATE INDEX IF NOT EXISTS idx_facturas_activos_items_factura ON public.facturas_activos_items(factura_id);

ALTER TABLE public.facturas_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_activos_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facturas activos read anon" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos read auth" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos write anon" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos write auth" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos update anon" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos update auth" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos delete anon" ON public.facturas_activos;
DROP POLICY IF EXISTS "Facturas activos delete auth" ON public.facturas_activos;

CREATE POLICY "Facturas activos read anon" ON public.facturas_activos
  FOR SELECT TO anon USING (true);
CREATE POLICY "Facturas activos read auth" ON public.facturas_activos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Facturas activos write anon" ON public.facturas_activos
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Facturas activos write auth" ON public.facturas_activos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Facturas activos update anon" ON public.facturas_activos
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Facturas activos update auth" ON public.facturas_activos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Facturas activos delete anon" ON public.facturas_activos
  FOR DELETE TO anon USING (true);
CREATE POLICY "Facturas activos delete auth" ON public.facturas_activos
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Facturas activos items read anon" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items read auth" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items write anon" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items write auth" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items update anon" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items update auth" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items delete anon" ON public.facturas_activos_items;
DROP POLICY IF EXISTS "Facturas activos items delete auth" ON public.facturas_activos_items;

CREATE POLICY "Facturas activos items read anon" ON public.facturas_activos_items
  FOR SELECT TO anon USING (true);
CREATE POLICY "Facturas activos items read auth" ON public.facturas_activos_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Facturas activos items write anon" ON public.facturas_activos_items
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Facturas activos items write auth" ON public.facturas_activos_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Facturas activos items update anon" ON public.facturas_activos_items
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Facturas activos items update auth" ON public.facturas_activos_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Facturas activos items delete anon" ON public.facturas_activos_items
  FOR DELETE TO anon USING (true);
CREATE POLICY "Facturas activos items delete auth" ON public.facturas_activos_items
  FOR DELETE TO authenticated USING (true);
