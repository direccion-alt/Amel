-- Script para resetear completamente el catálogo de casetas
-- Elimina todos los registros de ruta_casetas (depende de casetas_catalogo)
-- Luego elimina todos los registros de casetas_catalogo

-- Primero, eliminar todas las asignaciones de casetas a rutas
DELETE FROM public.ruta_casetas;

-- Luego, eliminar todas las casetas del catálogo
DELETE FROM public.casetas_catalogo;
