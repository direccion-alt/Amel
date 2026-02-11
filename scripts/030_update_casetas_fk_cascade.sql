-- Enable cascading delete from casetas_catalogo to ruta_casetas
-- This fixes FK restriction when deleting a caseta in use.

ALTER TABLE public.ruta_casetas
  DROP CONSTRAINT IF EXISTS ruta_casetas_caseta_id_fkey;

ALTER TABLE public.ruta_casetas
  ADD CONSTRAINT ruta_casetas_caseta_id_fkey
  FOREIGN KEY (caseta_id)
  REFERENCES public.casetas_catalogo(id)
  ON DELETE CASCADE;
