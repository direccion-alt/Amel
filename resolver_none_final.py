#!/usr/bin/env python3
"""
Script para identificar y resolver la asignación con precio None
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

def update_supabase_data(table_name, row_id, data):
    """Update data in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?id=eq.{row_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode(),
            headers=headers,
            method='PATCH'
        )
        with urllib.request.urlopen(req) as response:
            return True
    except urllib.error.URLError as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 100)
    print("BÚSQUEDA Y RESOLUCIÓN DE ASIGNACIÓN CON PRECIO = None")
    print("=" * 100)
    
    # Obtener datos
    rutas = fetch_supabase_data("rutas_operativas")
    casetas = fetch_supabase_data("casetas_catalogo")
    asignaciones = fetch_supabase_data("ruta_casetas")
    
    # Mapas
    casetas_por_id = {c['id']: c for c in casetas}
    rutas_por_id = {r['id']: r for r in rutas}
    
    # Buscar asignación con None
    for asig in asignaciones:
        if asig.get('precio_aplicado') is None:
            ruta_id = asig.get('ruta_id')
            caseta_id = asig.get('caseta_id')
            
            ruta = rutas_por_id.get(ruta_id)
            caseta = casetas_por_id.get(caseta_id)
            
            print(f"\n✓ Asignación encontrada:")
            print(f"  ID: {asig.get('id')}")
            print(f"  Ruta: {ruta.get('origen') if ruta else '?'} → {ruta.get('destino') if ruta else '?'}")
            print(f"  Caseta: {caseta.get('nombre') if caseta else '?'}")
            print(f"  Modalidad: {ruta.get('modalidad') if ruta else '?'}")
            
            if ruta and caseta:
                # Buscar precio correcto
                modalidad = ruta.get('modalidad', 'SENCILLO')
                
                if modalidad == 'TRACTO':
                    precio = caseta.get('precio_tracto', 100)
                elif modalidad == 'FULL':
                    precio = caseta.get('precio_full', 100)
                else:  # SENCILLO
                    precio = caseta.get('precio_sencillo', 100)
                
                print(f"\n  Precios disponibles en catálogo:")
                print(f"    TRACTO: ${caseta.get('precio_tracto', 'N/A')}")
                print(f"    SENCILLO: ${caseta.get('precio_sencillo', 'N/A')}")
                print(f"    FULL: ${caseta.get('precio_full', 'N/A')}")
                
                if precio is None:
                    precio = 100  # Precio por defecto
                
                print(f"\n  Precio a asignar: ${precio}")
                
                # Actualizar
                success = update_supabase_data(
                    "ruta_casetas",
                    asig.get('id'),
                    {"precio_aplicado": precio}
                )
                
                if success:
                    print(f"  ✓ ACTUALIZADO EXITOSAMENTE")
                else:
                    print(f"  ❌ ERROR EN UPDATE")

if __name__ == "__main__":
    main()
