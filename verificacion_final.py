#!/usr/bin/env python3
"""
Script final de verificación de los totales de casetas actualizados
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
        print(f"❌ Error: {e}")
        return []

def main():
    print("=" * 100)
    print("VERIFICACIÓN FINAL - ESTADO DE ACTUALIZACIÓN DE PRECIOS DE CASETAS")
    print("=" * 100)
    
    # Obtener datos
    rutas = fetch_supabase_data("rutas_operativas")
    casetas = fetch_supabase_data("casetas_catalogo")
    asignaciones = fetch_supabase_data("ruta_casetas")
    
    # Crear mapas
    casetas_por_id = {c['id']: c for c in casetas}
    
    print(f"\n✓ Total de rutas: {len(rutas)}")
    print(f"✓ Total de casetas en catálogo: {len(casetas)}")
    print(f"✓ Total de asignaciones: {len(asignaciones)}")
    
    # Verificar precios None
    none_count = sum(1 for a in asignaciones if a.get('precio_aplicado') is None)
    print(f"\n⚠️  Asignaciones con precio = None: {none_count}")
    
    # Verificar totales
    print(f"\n" + "=" * 100)
    print("VERIFICACIÓN DE TOTALES POR RUTA")
    print("=" * 100)
    
    rutas_ok = 0
    rutas_error = 0
    total_diferencia = 0
    
    for ruta in rutas:
        ruta_id = ruta.get('id')
        total_actual = ruta.get('total_casetas', 0)
        
        # Calcular total esperado
        total_esperado = 0
        for asig in asignaciones:
            if asig.get('ruta_id') == ruta_id:
                precio = asig.get('precio_aplicado')
                cantidad = asig.get('cantidad', 1)
                if precio is not None:
                    total_esperado += precio * cantidad
        
        diferencia = abs(total_actual - total_esperado)
        
        if diferencia > 0.01:  # Tolerancia
            print(f"\n⚠️  {ruta.get('origen')} → {ruta.get('destino')}")
            print(f"     Actual: ${total_actual:.2f} | Esperado: ${total_esperado:.2f} | Dif: ${diferencia:.2f}")
            rutas_error += 1
            total_diferencia += diferencia
        else:
            rutas_ok += 1
    
    # Resumen
    print(f"\n" + "=" * 100)
    print("RESUMEN FINAL")
    print("=" * 100)
    print(f"\n✓ Rutas con totales correctos: {rutas_ok}/{len(rutas)}")
    print(f"⚠️  Rutas con discrepancias: {rutas_error}/{len(rutas)}")
    print(f"❌ Asignaciones sin precio: {none_count}")
    
    if rutas_error == 0 and none_count == 0:
        print("\n✅ ¡SINCRONIZACIÓN COMPLETADA EXITOSAMENTE!")
        print("   Todos los precios de casetas han sido actualizados correctamente")
    else:
        print(f"\n⚠️  Diferencia total acumulada: ${total_diferencia:.2f}")
    
    print("\n" + "=" * 100)

if __name__ == "__main__":
    main()
