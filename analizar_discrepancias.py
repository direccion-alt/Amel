#!/usr/bin/env python3
"""
Script para investigar y corregir las discrepancias encontradas
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
    print("ANÁLISIS DE DISCREPANCIAS EN TOTALES DE CASETAS")
    print("=" * 100)
    
    # Obtener rutas para encontrar los IDs problemáticos
    rutas = fetch_supabase_data("rutas_operativas")
    
    problematic_routes = [
        "Benito Juárez, Q. Roo → Puebla, Pue",
        "Solidaridad, Q. Roo → Puebla, Pue"
    ]
    
    for route_name in problematic_routes:
        print(f"\n\n{'='*100}")
        print(f"ANALIZANDO: {route_name}")
        print('='*100)
        
        # Buscar la ruta
        ruta = None
        for r in rutas:
            if f"{r.get('origen')} → {r.get('destino')}" == route_name:
                ruta = r
                break
        
        if not ruta:
            print(f"❌ Ruta no encontrada")
            continue
        
        print(f"\n✓ Ruta encontrada:")
        print(f"  ID: {ruta.get('id')}")
        print(f"  Origen: {ruta.get('origen')}")
        print(f"  Destino: {ruta.get('destino')}")
        print(f"  Modalidad: {ruta.get('modalidad')}")
        print(f"  Total Casetas Actual: ${ruta.get('total_casetas', 0)}")
        
        # Obtener asignaciones de casetas para esta ruta
        asignaciones = fetch_supabase_data("ruta_casetas", f"&ruta_id=eq.{ruta.get('id')}")
        
        print(f"\n✓ Asignaciones de casetas ({len(asignaciones)}):")
        
        total_calculado = 0
        for i, asig in enumerate(asignaciones, 1):
            precio = asig.get('precio_aplicado')
            cantidad = asig.get('cantidad', 1)
            subtotal = (precio or 0) * cantidad
            total_calculado += subtotal
            
            # Obtener nombre de caseta
            caseta_id = asig.get('caseta_id')
            casetas = fetch_supabase_data("casetas_catalogo", f"&id=eq.{caseta_id}")
            caseta_name = casetas[0].get('nombre') if casetas else "Desconocida"
            
            print(f"  {i}. {caseta_name}")
            print(f"     Precio: ${precio} × Cantidad: {cantidad} = ${subtotal}")
        
        print(f"\n💰 Resumen:")
        print(f"  Total Calculado: ${total_calculado}")
        print(f"  Total en BD: ${ruta.get('total_casetas', 0)}")
        print(f"  Diferencia: ${ruta.get('total_casetas', 0) - total_calculado}")

if __name__ == "__main__":
    main()
