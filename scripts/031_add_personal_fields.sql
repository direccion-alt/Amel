-- Add personal management fields to operadores table
-- Includes: tipo_personal, salario, seguro_social, infonavit, empresa_seguro, maneja

ALTER TABLE public.operadores
ADD COLUMN IF NOT EXISTS tipo_personal TEXT CHECK (tipo_personal IN (
  'Operador(a)',
  'Contador(a)',
  'Auxiliar Contable',
  'Monitoreo',
  'Supervisor(a) de tráfico regional',
  'Gerente de trafico',
  'Mantenimiento M1',
  'Mantenimiento M2',
  'Mantenimiento M3'
)),
ADD COLUMN IF NOT EXISTS salario DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS seguro_social BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS infonavit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS empresa_seguro TEXT,
ADD COLUMN IF NOT EXISTS maneja BOOLEAN DEFAULT false;

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_operadores_tipo_personal ON public.operadores(tipo_personal);
