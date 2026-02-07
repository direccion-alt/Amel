#!/usr/bin/env python3
"""
Actualizar restricciones en la columna estado_carga
Eliminar VACÍO con acento y dejar solo VACIO
"""

import requests
import json

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("🔧 ACTUALIZANDO RESTRICCIONES DE ESTADO_CARGA")
print("=" * 80)

# Script SQL a ejecutar
sql_script = """
-- Verificar si existe CHECK constraint con VACÍO
-- Y eliminarlo si existe

-- Primero, obtener nombre de la restricción
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar constraint que mencione VACÍO o valores de estado
    SELECT constraint_name INTO constraint_name
    FROM information_schema.check_constraints
    WHERE table_name = 'rutas_operativas'
    AND column_name = 'estado_carga'
    AND constraint_definition LIKE '%VACÍO%'
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE rutas_operativas DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Constraint eliminado: %', constraint_name;
    END IF;
END $$;

-- Eliminar cualquier CHECK constraint viejo en estado_carga
ALTER TABLE IF EXISTS rutas_operativas 
DROP CONSTRAINT IF EXISTS estado_carga_check;

ALTER TABLE IF EXISTS rutas_operativas 
DROP CONSTRAINT IF EXISTS rutas_operativas_estado_carga_check;

-- Crear nuevo CHECK constraint solo con VACIO (sin acento)
ALTER TABLE rutas_operativas 
ADD CONSTRAINT estado_carga_check 
CHECK (estado_carga IN ('VACIO', 'CARGADO'));

-- Verificar que todo esté correcto
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rutas_operativas' AND column_name = 'estado_carga';
"""

print("\n📋 Script SQL a ejecutar en Supabase:")
print("-" * 80)
print(sql_script)

print("\n" + "=" * 80)
print("📝 INSTRUCCIONES:")
print("=" * 80)
print("""
1. Abre Supabase Console: https://app.supabase.com
2. Ve a: SQL Editor
3. Crea una nueva query
4. Copia y pega el script anterior
5. Ejecuta (Run)

O si prefieres hacerlo manualmente en la UI de Supabase:
1. Database → Tables → rutas_operativas
2. Selecciona la columna 'estado_carga'
3. En la sección de "Constraints"
4. Busca el CHECK constraint
5. Edítalo para dejar solo:
   - VACIO (sin acento)
   - CARGADO

Después de esto:
✅ La UI de Supabase mostrará solo opciones correctas
✅ No aparecerá más "VACÍO" con acento en el dropdown
✅ Los datos estarán 100% sincronizados
""")

print("=" * 80)
print("⚠️  NOTA IMPORTANTE:")
print("=" * 80)
print("""
Si el dropdown sigue mostrando "VACÍO" después de esto,
podría ser por:

1. Cache del navegador → Limpia con Ctrl+Shift+Delete
2. El campo podría tener un comentario → Editar desde tabla
3. Podría ser una lista hardcodeada en Next.js → Revisar código
""")

print("=" * 80)
