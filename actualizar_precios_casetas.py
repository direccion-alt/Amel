#!/usr/bin/env python3
"""
Script para actualizar precios de casetas uno por uno en Supabase
Sincroniza los precios conforme a los montos del catálogo de casetas
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

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
        print(f"❌ Error fetching {table_name}: {e}")
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
        print(f"❌ Error updating {table_name}: {e}")
        return False

def main():
    print("=" * 100)
    print("SINCRONIZACIÓN DE PRECIOS DE CASETAS")
    print("=" * 100)
    
    # Obtener datos necesarios
    print("\n[1] Obteniendo datos de Supabase...")
    rutas = fetch_supabase_data("rutas_operativas")
    casetas = fetch_supabase_data("casetas_catalogo")
    asignaciones = fetch_supabase_data("ruta_casetas")
    
    print(f"✓ Rutas: {len(rutas)}")
    print(f"✓ Casetas: {len(casetas)}")
    print(f"✓ Asignaciones: {len(asignaciones)}")
    
    # Crear mapas para búsqueda rápida
    casetas_por_id = {c['id']: c for c in casetas}
    rutas_por_id = {r['id']: r for r in rutas}
    
    # Procesar asignaciones y actualizar precios
    print("\n" + "=" * 100)
    print("ACTUALIZANDO PRECIOS DE ASIGNACIONES")
    print("=" * 100)
    
    updates_realizados = 0
    errors = []
    
    for i, asig in enumerate(asignaciones, 1):
        ruta_id = asig.get('ruta_id')
        caseta_id = asig.get('caseta_id')
        precio_actual = asig.get('precio_aplicado')
        
        if ruta_id not in rutas_por_id or caseta_id not in casetas_por_id:
            continue
        
        ruta = rutas_por_id[ruta_id]
        caseta = casetas_por_id[caseta_id]
        modalidad = ruta.get('modalidad', '')
        
        # Determinar precio según modalidad
        if modalidad == 'TRACTO':
            precio_esperado = caseta.get('precio_tracto', 0)
        elif modalidad == 'SENCILLO':
            precio_esperado = caseta.get('precio_sencillo', 0)
        elif modalidad == 'FULL':
            precio_esperado = caseta.get('precio_full', 0)
        else:
            precio_esperado = 0
        
        # Verificar si necesita actualización
        if precio_actual != precio_esperado:
            print(f"\n[{i}/{len(asignaciones)}] Asignación ID: {asig.get('id')}")
            print(f"  Ruta: {ruta.get('origen')} → {ruta.get('destino')} ({modalidad})")
            print(f"  Caseta: {caseta.get('nombre')}")
            print(f"  Precio Actual: ${precio_actual}")
            print(f"  Precio Esperado: ${precio_esperado}")
            
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
                errors.append({
                    'asignacion_id': asig.get('id'),
                    'error': f'No se pudo actualizar precio de {caseta.get("nombre")}'
                })
                print(f"  ❌ ERROR EN UPDATE")
        else:
            # Mostrar progreso cada 10
            if i % 10 == 0:
                print(f"[{i}/{len(asignaciones)}] Verificadas sin cambios...", end='\r')
    
    # Resumen
    print("\n" + "=" * 100)
    print("RESUMEN DE CAMBIOS")
    print("=" * 100)
    print(f"✓ Actualizaciones realizadas: {updates_realizados}")
    print(f"❌ Errores encontrados: {len(errors)}")
    
    if errors:
        print("\nErrores:")
        for err in errors:
            print(f"  - {err['error']}")
    
    print("\n" + "=" * 100)
    print("VERIFICACIÓN FINAL DE TOTALES")
    print("=" * 100)
    
    # Volver a obtener rutas actualizadas
    rutas_actualizadas = fetch_supabase_data("rutas_operativas")
    asignaciones_actualizadas = fetch_supabase_data("ruta_casetas")
    
    rutas_ok = 0
    rutas_error = 0
    
    for ruta in rutas_actualizadas:
        ruta_id = ruta.get('id')
        total_actual = ruta.get('total_casetas', 0)
        
        # Calcular total esperado
        total_esperado = 0
        for asig in asignaciones_actualizadas:
            if asig.get('ruta_id') == ruta_id:
                precio = asig.get('precio_aplicado', 0)
                cantidad = asig.get('cantidad', 1)
                if precio:
                    total_esperado += precio * cantidad
        
        if abs(total_actual - total_esperado) > 0.01:
            print(f"⚠️  {ruta.get('origen')} → {ruta.get('destino')}")
            print(f"     Actual: ${total_actual} | Esperado: ${total_esperado}")
            rutas_error += 1
        else:
            rutas_ok += 1
    
    print(f"\n✓ Rutas correctas: {rutas_ok}")
    print(f"⚠️  Rutas con discrepancia: {rutas_error}")
    
    return updates_realizados

if __name__ == "__main__":
    resultado = main()
    print("\n✓ Sincronización completada")
