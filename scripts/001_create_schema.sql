-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de unidades de transporte
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL UNIQUE,
  plate_number TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  unit_type TEXT DEFAULT 'truck',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  zeek_device_id TEXT, -- ID del dispositivo Zeek GPS para el iframe
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = unidad propia de la empresa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignación usuario-unidad (para terceros que pueden ver múltiples unidades)
CREATE TABLE IF NOT EXISTS public.user_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

-- Tabla de registros de kilometraje y combustible
CREATE TABLE IF NOT EXISTS public.fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer_reading DECIMAL(10,2),
  fuel_liters DECIMAL(10,2),
  fuel_cost DECIMAL(10,2),
  fuel_type TEXT DEFAULT 'diesel',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de viajes y entregas
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date TIMESTAMPTZ,
  arrival_date TIMESTAMPTZ,
  distance_km DECIMAL(10,2),
  cargo_description TEXT,
  client_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mantenimiento
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  provider TEXT,
  next_maintenance_date DATE,
  odometer_at_service DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar si usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si usuario tiene acceso a una unidad
CREATE OR REPLACE FUNCTION public.has_unit_access(unit_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin() OR EXISTS (
    SELECT 1 FROM public.user_units 
    WHERE user_id = auth.uid() AND unit_id = unit_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Políticas RLS para units
CREATE POLICY "Users can view assigned units" ON public.units
  FOR SELECT USING (public.has_unit_access(id));

CREATE POLICY "Admins can manage all units" ON public.units
  FOR ALL USING (public.is_admin());

-- Políticas RLS para user_units
CREATE POLICY "Users can view own assignments" ON public.user_units
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assignments" ON public.user_units
  FOR ALL USING (public.is_admin());

-- Políticas RLS para fuel_records
CREATE POLICY "Users can view fuel records of assigned units" ON public.fuel_records
  FOR SELECT USING (public.has_unit_access(unit_id));

CREATE POLICY "Admins can manage all fuel records" ON public.fuel_records
  FOR ALL USING (public.is_admin());

-- Políticas RLS para trips
CREATE POLICY "Users can view trips of assigned units" ON public.trips
  FOR SELECT USING (public.has_unit_access(unit_id));

CREATE POLICY "Admins can manage all trips" ON public.trips
  FOR ALL USING (public.is_admin());

-- Políticas RLS para maintenance_records
CREATE POLICY "Users can view maintenance of assigned units" ON public.maintenance_records
  FOR SELECT USING (public.has_unit_access(unit_id));

CREATE POLICY "Admins can manage all maintenance records" ON public.maintenance_records
  FOR ALL USING (public.is_admin());
