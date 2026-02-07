#!/usr/bin/env python3
"""
Corregir acentos en estados de carga - Con verificación detallada
"""

import requests
import json

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("🔧 CORRIGIENDO ACENTOS EN ESTADOS DE CARGA")
print("=" * 80)

# 1. Buscar rutas con VACÍO (con acento)
print("\n1️⃣  BUSCANDO RUTAS CON 'VACÍO' (con acento)...")
print("-" * 80)

url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?estado_carga=eq.VACÍO"
response = requests.get(url, headers=headers)

print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    rutas_con_acento = response.json()
    print(f"✅ Se encontraron {len(rutas_con_acento)} rutas con VACÍO (acento):\n")
    
    for ruta in rutas_con_acento:
        print(f"   • {ruta['origen']} → {ruta['destino']} ({ruta['modalidad']})")
    
    if len(rutas_con_acento) > 0:
        # 2. Actualizar cada una
        print(f"\n2️⃣  ACTUALIZANDO {len(rutas_con_acento)} RUTAS...")
        print("-" * 80)
        
        actualizadas = 0
        errores = 0
        
        for ruta in rutas_con_acento:
            ruta_id = ruta['id']
            origen = ruta['origen']
            destino = ruta['destino']
            
            # PATCH para cambiar VACÍO → VACIO
            update_url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?id=eq.{ruta_id}"
            update_data = {
                "estado_carga": "VACIO"
            }
            
            print(f"\n   Actualizando: {origen} → {destino}")
            print(f"   URL: {update_url}")
            print(f"   Data: {update_data}")
            
            update_response = requests.patch(update_url, headers=headers, json=update_data)
            
            print(f"   Response Status: {update_response.status_code}")
            print(f"   Response Body: {update_response.text[:200]}")
            
            if update_response.status_code in [200, 204]:
                print(f"   ✅ ACTUALIZADO")
                actualizadas += 1
            else:
                print(f"   ❌ ERROR")
                errores += 1
        
        # 3. Verificar cambios
        print(f"\n3️⃣  VERIFICANDO CAMBIOS...")
        print("-" * 80)
        
        verify_url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?estado_carga=eq.VACÍO"
        verify_response = requests.get(verify_url, headers=headers)
        
        if verify_response.status_code == 200:
            rutas_restantes = verify_response.json()
            print(f"\n✅ Rutas aún con VACÍO (acento): {len(rutas_restantes)}")
            print(f"✅ Rutas actualizadas: {actualizadas}")
            print(f"❌ Errores: {errores}")
        
        print("\n" + "=" * 80)
        print("✅ CORRECCIÓN COMPLETADA")
        print("=" * 80)

else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
