#!/usr/bin/env python3
"""
Investigar precios reales de caseta Grijalva en Supabase
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

def fetch_supabase_data(table_name, filters=None):
    """Fetch data from Supabase table"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    if filters:
        url += filters
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
    print("INVESTIGACIÓN: PRECIOS DE CASETA GRIJALVA")
    print("=" * 100)
    
    # Obtener todas las casetas que contengan "grijalva" (case insensitive)
    casetas = fetch_supabase_data("casetas_catalogo")
    
    print("\n🔍 Buscando caseta 'Grijalva' en catálogo...\n")
    
    grijalva_casetas = [c for c in casetas if 'grijalva' in c.get('nombre', '').lower()]
    
    if grijalva_casetas:
        for i, caseta in enumerate(grijalva_casetas, 1):
            print(f"Caseta {i}: {caseta.get('nombre')}")
            print(f"  ID: {caseta.get('id')}")
            print(f"  Precio TRACTO: ${caseta.get('precio_tracto', 'N/A')}")
            print(f"  Precio SENCILLO: ${caseta.get('precio_sencillo', 'N/A')}")
            print(f"  Precio FULL: ${caseta.get('precio_full', 'N/A')}")
            print(f"  Activo: {caseta.get('activo', True)}")
            print()
    else:
        print("❌ No se encontró caseta con nombre 'Grijalva'")
    
    # Buscar la ruta específica
    print("\n" + "=" * 100)
    print("INFORMACIÓN DE LA RUTA: Benito Juárez, Q. Roo → Puebla, Pue")
    print("=" * 100 + "\n")
    
    rutas = fetch_supabase_data("rutas_operativas")
    
    ruta = None
    for r in rutas:
        if (r.get('origen') == 'Benito Juárez, Q. Roo' and 
            r.get('destino') == 'Puebla, Pue'):
            ruta = r
            break
    
    if ruta:
        print(f"✓ Ruta encontrada:")
        print(f"  ID: {ruta.get('id')}")
        print(f"  Origen: {ruta.get('origen')}")
        print(f"  Destino: {ruta.get('destino')}")
        print(f"  Modalidad: {ruta.get('modalidad')}")
        print(f"  Total Casetas Actual: ${ruta.get('total_casetas', 0)}")
        
        # Obtener asignaciones para esta ruta
        asignaciones = fetch_supabase_data("ruta_casetas", f"&ruta_id=eq.{ruta.get('id')}")
        
        print(f"\n✓ Asignaciones de casetas en esta ruta ({len(asignaciones)}):\n")
        
        casetas_map = {c['id']: c for c in casetas}
        
        for i, asig in enumerate(asignaciones, 1):
            caseta_id = asig.get('caseta_id')
            caseta = casetas_map.get(caseta_id)
            caseta_nombre = caseta.get('nombre') if caseta else 'Desconocida'
            precio_aplicado = asig.get('precio_aplicado')
            
            # Resaltar Grijalva
            if 'grijalva' in caseta_nombre.lower():
                print(f"  >>> {i}. {caseta_nombre} <<<")
                print(f"       Precio Aplicado: ${precio_aplicado}")
                if caseta:
                    print(f"       Precio SENCILLO en catálogo: ${caseta.get('precio_sencillo', 'N/A')}")
                print()
            else:
                print(f"  {i}. {caseta_nombre}: ${precio_aplicado}")
    else:
        print("❌ Ruta no encontrada")

if __name__ == "__main__":
    main()
