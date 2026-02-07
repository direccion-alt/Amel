#!/usr/bin/env python3
"""
Verificar y habilitar Realtime en Supabase para sincronización en tiempo real
"""

import os
import json
from supabase import create_client

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("📊 VERIFICACIÓN DE REALTIME EN SUPABASE")
print("=" * 60)

# Tablas que necesitan Realtime habilitado
TABLAS_CRITICAS = [
    "rutas_operativas",
    "viajes",
    "ruta_casetas",
    "casetas_catalogo"
]

print("\n✅ CONFIGURACIÓN ACTUAL:")
print("\nTablas que serán monitoreadas en tiempo real:")
for tabla in TABLAS_CRITICAS:
    print(f"  • {tabla}")

print("\n📋 PASOS PARA HABILITAR REALTIME:")
print("""
1. Ir a Supabase Dashboard: https://app.supabase.com
2. Seleccionar tu proyecto
3. Ir a: Database → Replication
4. Habilitarpara cada tabla:
   - rutas_operativas
   - viajes
   - ruta_casetas
   - casetas_catalogo
5. Marcar: "Inserts", "Updates", "Deletes"

O ejecutar SQL directamente en Supabase:
""")

sql_commands = """
-- Habilitar Realtime en rutas_operativas
ALTER PUBLICATION supabase_realtime ADD TABLE rutas_operativas;

-- Habilitar Realtime en viajes
ALTER PUBLICATION supabase_realtime ADD TABLE viajes;

-- Habilitar Realtime en ruta_casetas
ALTER PUBLICATION supabase_realtime ADD TABLE ruta_casetas;

-- Habilitar Realtime en casetas_catalogo
ALTER PUBLICATION supabase_realtime ADD TABLE casetas_catalogo;
"""

print(sql_commands)

print("\n✨ BENEFICIOS DE REALTIME:")
print("""
✓ Cuando alguien edita una caseta → se actualiza instantáneamente
✓ Cuando alguien modifica una ruta → se actualiza el total_casetas
✓ Dashboard muestra datos en tiempo real sin refrescar
✓ Todos los usuarios ven cambios simultáneamente
✓ Cálculos financieros siempre precisos
""")

print("\n🔍 PRUEBA DE CONEXIÓN:")
try:
    response = supabase.table("rutas_operativas").select("*").limit(1).execute()
    print(f"✅ Conexión Supabase OK - {len(response.data)} registros")
except Exception as e:
    print(f"❌ Error de conexión: {e}")

print("\n" + "=" * 60)
print("⏱️  Una vez habilitado Realtime, el dashboard se actualizará")
print("   automáticamente cuando cambien los datos en Supabase")
print("=" * 60)
