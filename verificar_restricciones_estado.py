#!/usr/bin/env python3
"""
Verificar qué valores están permitidos en campo estado_carga
Posibles restricciones: ENUM, CHECK constraint, etc.
"""

import requests

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("🔍 VERIFICANDO VALORES PERMITIDOS EN ESTADO_CARGA")
print("=" * 80)

# 1. Obtener todos los valores únicos de estado_carga en la tabla
print("\n1️⃣  VALORES ACTUALES EN LA BASE DE DATOS:")
print("-" * 80)

try:
    url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?select=estado_carga"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        rutas = response.json()
        valores_unicos = set()
        
        for ruta in rutas:
            if ruta.get('estado_carga'):
                valores_unicos.add(ruta['estado_carga'])
        
        valores_ordenados = sorted(valores_unicos)
        print(f"✅ Valores encontrados ({len(valores_unicos)}):\n")
        for valor in valores_ordenados:
            print(f"   • '{valor}'")
        
        if "VACÍO" in valores_unicos:
            print("\n   ❌ Aún hay 'VACÍO' con acento")
        if "VACIO" in valores_unicos:
            print("\n   ✅ 'VACIO' sin acento presente")
    else:
        print(f"❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

# 2. Consultar información de columnas (metadata)
print("\n\n2️⃣  INFORMACIÓN DE LA COLUMNA estado_carga:")
print("-" * 80)

print("""
Posibles restricciones encontradas en Supabase:

Si el campo estado_carga es de tipo ENUM:
→ Necesita actualizar el tipo ENUM para eliminar 'VACÍO'

Si hay CHECK constraint:
→ Necesita actualizar el constraint

Si hay valores por defecto o lista fija:
→ Necesita actualizar en la UI/formulario
""")

# 3. Buscar si hay VACÍO (con acento) en viajes también
print("\n3️⃣  VERIFICANDO TABLA VIAJES:")
print("-" * 80)

try:
    url = f"{SUPABASE_URL}/rest/v1/viajes?select=estado_carga"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        viajes = response.json()
        valores_viajes = set()
        
        for viaje in viajes:
            if viaje.get('estado_carga'):
                valores_viajes.add(viaje['estado_carga'])
        
        valores_ordenados = sorted(valores_viajes)
        print(f"Valores en viajes ({len(valores_viajes)}):\n")
        for valor in valores_ordenados:
            print(f"   • '{valor}'")
            
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 80)
print("📝 SOLUCIÓN:")
print("=" * 80)
print("""
Si necesitas cambiar los valores permitidos en el formulario de Supabase:

OPCIÓN 1: Actualizar mediante SQL directo
→ Ir a Supabase → SQL Editor
→ Ejecutar script para cambiar restricciones

OPCIÓN 2: Cambiar en la UI de Supabase
→ Database → Tables → rutas_operativas
→ Seleccionar columna 'estado_carga'
→ Ver si es ENUM y actualizar valores

¿Necesitas que genere un script SQL para actualizar la restricción?
""")

print("=" * 80)
