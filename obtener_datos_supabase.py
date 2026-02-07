#!/usr/bin/env python3
import sys
import json

# Instalar supabase si es necesario
try:
    from supabase import create_client
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "supabase"], check=True)
    from supabase import create_client

# Conectar a Supabase
url = "https://hgkzcdmagdtjgxaniswr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

supabase = create_client(url, key)

print("=" * 80)
print("RUTAS OPERATIVAS CON TOTAL CASETAS")
print("=" * 80)

response = supabase.table("rutas_operativas").select("*").execute()
rutas = response.data

print(f"\nTotal de rutas: {len(rutas)}\n")
for i, ruta in enumerate(rutas):
    print(f"Ruta {i+1}:")
    print(f"  ID: {ruta.get('id')}")
    print(f"  Origen: {ruta.get('origen')}")
    print(f"  Destino: {ruta.get('destino')}")
    print(f"  Modalidad: {ruta.get('modalidad')}")
    print(f"  Estado Carga: {ruta.get('estado_carga')}")
    print(f"  Total Casetas: ${ruta.get('total_casetas', 0)}")
    print(f"  Costo Ruta: ${ruta.get('costo_ruta', 0)}")
    print(f"  Pago Operador: ${ruta.get('pago_operador', 0)}")
    print()

print("\n" + "=" * 80)
print("CASETAS DEL CATÁLOGO")
print("=" * 80)

response = supabase.table("casetas_catalogo").select("*").execute()
casetas = response.data

print(f"\nTotal de casetas: {len(casetas)}\n")
for i, caseta in enumerate(casetas):
    print(f"Caseta {i+1}:")
    print(f"  ID: {caseta.get('id')}")
    print(f"  Nombre: {caseta.get('nombre')}")
    print(f"  Precio TRACTO: ${caseta.get('precio_tracto', 0)}")
    print(f"  Precio SENCILLO: ${caseta.get('precio_sencillo', 0)}")
    print(f"  Precio FULL: ${caseta.get('precio_full', 0)}")
    print(f"  Activo: {caseta.get('activo', True)}")
    print()

print("\n" + "=" * 80)
print("ASIGNACIONES RUTA-CASETAS")
print("=" * 80)

response = supabase.table("ruta_casetas").select("*").execute()
asignaciones = response.data

print(f"\nTotal de asignaciones: {len(asignaciones)}\n")
for i, asig in enumerate(asignaciones):
    print(f"Asignación {i+1}:")
    print(f"  Ruta ID: {asig.get('ruta_id')}")
    print(f"  Caseta ID: {asig.get('caseta_id')}")
    print(f"  Cantidad: {asig.get('cantidad', 1)}")
    print(f"  Precio Aplicado: ${asig.get('precio_aplicado', 0)}")
    print()

print("\n" + "=" * 80)
print("RESUMEN DE DATOS CARGADOS")
print("=" * 80)
print(f"Rutas: {len(rutas)}")
print(f"Casetas: {len(casetas)}")
print(f"Asignaciones: {len(asignaciones)}")
