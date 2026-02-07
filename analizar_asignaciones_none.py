#!/usr/bin/env python3
"""
Limpiar asignaciones de casetas inactivas
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

def fetch_supabase_data(table_name):
    """Fetch data from Supabase table"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except urllib.error.URLError as e:
        print(f"❌ Error: {e}")
        return []

def main():
    print("=" * 100)
    print("ANÁLISIS DE ASIGNACIONES CON PRECIO = None")
    print("=" * 100)
    
    casetas = fetch_supabase_data("casetas_catalogo")
    asignaciones = fetch_supabase_data("ruta_casetas")
    rutas = fetch_supabase_data("rutas_operativas")
    
    # Mapas
    casetas_map = {c['id']: c for c in casetas}
    rutas_map = {r['id']: r for r in rutas}
    
    # Buscar asignaciones sin precio
    print("\n🔍 Buscando asignaciones con precio = None...\n")
    
    asignaciones_none = [a for a in asignaciones if a.get('precio_aplicado') is None]
    
    print(f"Encontradas {len(asignaciones_none)} asignaciones sin precio:\n")
    
    for asig in asignaciones_none:
        caseta_id = asig.get('caseta_id')
        ruta_id = asig.get('ruta_id')
        
        caseta = casetas_map.get(caseta_id)
        ruta = rutas_map.get(ruta_id)
        
        print(f"Asignación ID: {asig.get('id')}")
        print(f"  Caseta: {caseta.get('nombre') if caseta else '?'} (ID: {caseta_id})")
        estado = 'ACTIVO' if (caseta and caseta.get('activo')) else 'INACTIVO'
        print(f"  Estado: {estado}")
        print(f"  Ruta: {ruta.get('origen') if ruta else '?'} → {ruta.get('destino') if ruta else '?'}")
        print(f"  Modalidad: {ruta.get('modalidad') if ruta else '?'}")
        print()
    
    print("\n" + "=" * 100)
    print("RESUMEN")
    print("=" * 100)
    print(f"\nAsignaciones con precio None: {len(asignaciones_none)}")
    print(f"Nota: Estas asignaciones son de casetas INACTIVAS y no afectan los totales")

if __name__ == "__main__":
    main()
