#!/usr/bin/env python3
"""
Script para obtener y sincronizar precios de casetas entre Supabase y análisis financiero
"""

import json
import urllib.request
import urllib.error

# Credenciales de Supabase
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
        print(f"Error fetching {table_name}: {e}")
        return []

def main():
    print("=" * 100)
    print("OBTENER DATOS DE SUPABASE - ANÁLISIS FINANCIERO")
    print("=" * 100)
    
    # Obtener rutas operativas
    print("\n[1] Obteniendo rutas operativas...")
    rutas = fetch_supabase_data("rutas_operativas")
    print(f"✓ Se obtuvieron {len(rutas)} rutas operativas")
    
    if rutas:
        print("\nRutas disponibles:")
        for i, ruta in enumerate(rutas, 1):
            print(f"\n  Ruta {i}:")
            print(f"    ID: {ruta.get('id')}")
            print(f"    Origen: {ruta.get('origen')} → Destino: {ruta.get('destino')}")
            print(f"    Modalidad: {ruta.get('modalidad')} | Estado: {ruta.get('estado_carga')}")
            print(f"    Costo Ruta (Cliente): ${ruta.get('costo_ruta', 0)}")
            print(f"    Pago Operador: ${ruta.get('pago_operador', 0)}")
            print(f"    💰 TOTAL CASETAS ACTUAL: ${ruta.get('total_casetas', 0)}")
    
    # Obtener casetas del catálogo
    print("\n" + "-" * 100)
    print("\n[2] Obteniendo catálogo de casetas...")
    casetas = fetch_supabase_data("casetas_catalogo")
    print(f"✓ Se obtuvieron {len(casetas)} casetas")
    
    if casetas:
        print("\nCasetas disponibles:")
        for i, caseta in enumerate(casetas, 1):
            print(f"\n  Caseta {i}: {caseta.get('nombre')}")
            print(f"    ID: {caseta.get('id')}")
            print(f"    Precio TRACTO: ${caseta.get('precio_tracto', 0)}")
            print(f"    Precio SENCILLO: ${caseta.get('precio_sencillo', 0)}")
            print(f"    Precio FULL: ${caseta.get('precio_full', 0)}")
    
    # Obtener asignaciones de casetas a rutas
    print("\n" + "-" * 100)
    print("\n[3] Obteniendo asignaciones de casetas a rutas...")
    asignaciones = fetch_supabase_data("ruta_casetas")
    print(f"✓ Se obtuvieron {len(asignaciones)} asignaciones")
    
    if asignaciones:
        print("\nAsignaciones de casetas:")
        for i, asig in enumerate(asignaciones, 1):
            print(f"\n  Asignación {i}:")
            print(f"    Ruta ID: {asig.get('ruta_id')}")
            print(f"    Caseta ID: {asig.get('caseta_id')}")
            print(f"    Cantidad: {asig.get('cantidad', 1)}")
            print(f"    Precio Aplicado: ${asig.get('precio_aplicado', 0)}")
    
    # Resumen
    print("\n" + "=" * 100)
    print("RESUMEN DE DATOS CARGADOS")
    print("=" * 100)
    print(f"Rutas Operativas: {len(rutas)}")
    print(f"Casetas del Catálogo: {len(casetas)}")
    print(f"Asignaciones Ruta-Casetas: {len(asignaciones)}")
    
    # Validaciones
    print("\n" + "=" * 100)
    print("VALIDACIONES")
    print("=" * 100)
    
    # Verificar que el total_casetas en rutas coincida con la suma de casetas asignadas
    print("\n[✓] Verificando que total_casetas sea correcto...")
    for ruta in rutas:
        ruta_id = ruta.get('id')
        total_actual = ruta.get('total_casetas', 0)
        
        # Calcular total esperado
        total_esperado = 0
        for asig in asignaciones:
            if asig.get('ruta_id') == ruta_id:
                caseta_id = asig.get('caseta_id')
                cantidad = asig.get('cantidad', 1)
                precio_aplicado = asig.get('precio_aplicado', 0)
                total_esperado += precio_aplicado * cantidad
        
        if abs(total_actual - total_esperado) > 0.01:  # Tolerancia de 0.01
            print(f"  ⚠️  Ruta {ruta.get('origen')} → {ruta.get('destino')}")
            print(f"      Total Actual: ${total_actual}")
            print(f"      Total Esperado: ${total_esperado}")
            print(f"      DIFERENCIA: ${total_actual - total_esperado}")
        else:
            print(f"  ✓ {ruta.get('origen')} → {ruta.get('destino')}: ${total_actual} (correcto)")
    
    return {
        'rutas': rutas,
        'casetas': casetas,
        'asignaciones': asignaciones
    }

if __name__ == "__main__":
    main()
