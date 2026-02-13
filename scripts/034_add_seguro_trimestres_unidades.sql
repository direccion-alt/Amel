-- Agregar control de pago trimestral de seguro en unidades

ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS seguro_trimestres_pagados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seguro_total_pagado NUMERIC;

CREATE INDEX IF NOT EXISTS idx_unidades_seguro_trimestres ON public.unidades(seguro_trimestres_pagados);
