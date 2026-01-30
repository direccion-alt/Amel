-- Script opcional para agregar datos de demostración
-- Ejecutar solo si deseas ver datos de ejemplo en el sistema

-- Nota: Este script asume que ya tienes al menos un usuario admin creado
-- Si no tienes usuarios, primero regístrate en la aplicación

-- Insertar unidades de ejemplo
INSERT INTO public.units (unit_number, plate_number, brand, model, year, status, zeek_device_id) VALUES
('U-001', 'ABC-123', 'Kenworth', 'T680', 2022, 'active', 'ZEEK-001'),
('U-002', 'DEF-456', 'Freightliner', 'Cascadia', 2021, 'active', 'ZEEK-002'),
('U-003', 'GHI-789', 'International', 'LT', 2023, 'active', 'ZEEK-003'),
('U-004', 'JKL-012', 'Volvo', 'VNL', 2020, 'maintenance', NULL),
('U-005', 'MNO-345', 'Peterbilt', '579', 2022, 'active', 'ZEEK-005')
ON CONFLICT (unit_number) DO NOTHING;

-- Insertar registros de combustible de ejemplo
INSERT INTO public.fuel_records (unit_id, date, odometer_reading, fuel_liters, fuel_cost, fuel_type, notes)
SELECT 
  u.id,
  CURRENT_DATE - (random() * 30)::int,
  150000 + (random() * 10000)::int,
  150 + (random() * 100)::int,
  3500 + (random() * 2000)::int,
  'diesel',
  'Carga regular'
FROM public.units u
WHERE u.unit_number IN ('U-001', 'U-002', 'U-003')
LIMIT 10;

-- Insertar viajes de ejemplo
INSERT INTO public.trips (unit_id, origin, destination, departure_date, distance_km, client_name, status)
SELECT
  u.id,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Ciudad de México'
    WHEN 1 THEN 'Guadalajara'
    WHEN 2 THEN 'Monterrey'
    ELSE 'Tijuana'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Monterrey'
    WHEN 1 THEN 'Ciudad de México'
    WHEN 2 THEN 'Veracruz'
    ELSE 'Mérida'
  END,
  NOW() - (random() * 7 || ' days')::interval,
  500 + (random() * 1500)::int,
  CASE (random() * 2)::int
    WHEN 0 THEN 'FEMSA'
    WHEN 1 THEN 'Bimbo'
    ELSE 'Liverpool'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'completed'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'pending'
    ELSE 'completed'
  END
FROM public.units u
WHERE u.unit_number IN ('U-001', 'U-002', 'U-003', 'U-005')
LIMIT 8;

-- Insertar registros de mantenimiento de ejemplo
INSERT INTO public.maintenance_records (unit_id, date, maintenance_type, description, cost, provider, odometer_at_service, next_maintenance_date)
SELECT
  u.id,
  CURRENT_DATE - (random() * 60)::int,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Cambio de aceite'
    WHEN 1 THEN 'Cambio de llantas'
    WHEN 2 THEN 'Frenos'
    WHEN 3 THEN 'Afinación'
    ELSE 'Revisión general'
  END,
  'Servicio preventivo programado',
  2000 + (random() * 8000)::int,
  'Taller Mecánico Central',
  145000 + (random() * 10000)::int,
  CURRENT_DATE + (30 + (random() * 60)::int)
FROM public.units u
LIMIT 6;
