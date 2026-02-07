-- =====================================================
-- AGREGAR PERMISOS POR PERFIL
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR COLUMNA permissions
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 2. DEFINIR PERMISOS POR DEFECTO
-- Admin: todo habilitado
UPDATE public.profiles
SET permissions = jsonb_build_object(
  'dashboard', true,
  'units', true,
  'operators', true,
  'rutas', true,
  'casetas', true,
  'control_diesel', true,
  'trips', true,
  'analisis', true,
  'mantenimiento', true,
  'tracking', true,
  'users', true,
  'settings', true
)
WHERE role = 'admin' AND (permissions IS NULL OR permissions = '{}'::jsonb);

-- Usuario: acceso básico
UPDATE public.profiles
SET permissions = jsonb_build_object(
  'dashboard', true,
  'units', true,
  'operators', false,
  'rutas', false,
  'casetas', false,
  'control_diesel', true,
  'trips', true,
  'analisis', false,
  'mantenimiento', true,
  'tracking', true,
  'users', false,
  'settings', false
)
WHERE role = 'user' AND (permissions IS NULL OR permissions = '{}'::jsonb);

-- 3. VERIFICACIÓN
SELECT id, email, role, permissions FROM public.profiles ORDER BY created_at DESC LIMIT 10;
