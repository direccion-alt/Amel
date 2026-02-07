-- =====================================================
-- AGREGAR ESTATUS DE APROBACIÓN A PERFILES
-- Ejecuta TODO esto en Supabase SQL Editor
-- =====================================================

-- 1. AGREGAR COLUMNA status
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. APROBAR USUARIOS EXISTENTES (evita bloquear a admins actuales)
UPDATE public.profiles
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- 3. VERIFICACIÓN
SELECT id, email, role, status FROM public.profiles ORDER BY created_at DESC LIMIT 10;
