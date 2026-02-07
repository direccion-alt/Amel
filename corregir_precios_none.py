#!/usr/bin/env python3
"""
Script para corregir precios faltantes (None) en asignaciones de casetas
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
    print("CORRECCIÓN DE PRECIOS FALTANTES EN ASIGNACIONES")
    print("=" * 100)
    
    # Obtener datos
    rutas = fetch_supabase_data("rutas_operativas")
    casetas = fetch_supabase_data("casetas_catalogo")
    asignaciones = fetch_supabase_data("ruta_casetas")
    
    # Crear mapas
    casetas_por_id = {c['id']: c for c in casetas}
    rutas_por_id = {r['id']: r for r in rutas}
    
    # Buscar asignaciones con precio None
    asignaciones_con_none = [a for a in asignaciones if a.get('precio_aplicado') is None]
    
    print(f"\n✓ Encontradas {len(asignaciones_con_none)} asignaciones con precio = None")
    
    updates_realizados = 0
    
    for asig in asignaciones_con_none:
        ruta_id = asig.get('ruta_id')
        caseta_id = asig.get('caseta_id')
        
        if ruta_id not in rutas_por_id or caseta_id not in casetas_por_id:
            continue
        
        ruta = rutas_por_id[ruta_id]
        caseta = casetas_por_id[caseta_id]
        modalidad = ruta.get('modalidad', '')
        
        # Determinar precio
        if modalidad == 'TRACTO':
            precio_esperado = caseta.get('precio_tracto', 0)
        elif modalidad == 'SENCILLO':
            precio_esperado = caseta.get('precio_sencillo', 0)
        elif modalidad == 'FULL':
            precio_esperado = caseta.get('precio_full', 0)
        else:
            precio_esperado = 0
        
        print(f"\n[{updates_realizados + 1}] Actualizando...")
        print(f"  Ruta: {ruta.get('origen')} → {ruta.get('destino')} ({modalidad})")
        print(f"  Caseta: {caseta.get('nombre')}")
        print(f"  Precio asignado: ${precio_esperado}")
        
        # Actualizar
        success = update_supabase_data(
            "ruta_casetas",
            asig.get('id'),
            {"precio_aplicado": precio_esperado}
        )
        
        if success:
            print(f"  ✓ ACTUALIZADO")
            updates_realizados += 1
        else:
            print(f"  ❌ ERROR")
    
    print(f"\n" + "=" * 100)
    print(f"✓ Total de actualizaciones realizadas: {updates_realizados}")
    print(f"✓ Corrección completada")
    print("=" * 100)

if __name__ == "__main__":
    main()
