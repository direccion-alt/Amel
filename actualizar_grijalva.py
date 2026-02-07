#!/usr/bin/env python3
"""
Actualizar precios de caseta Grijalva correcta con el precio aplicado
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

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
    print("ACTUALIZACIÓN: PRECIOS DE CASETA GRIJALVA")
    print("=" * 100)
    
    # La caseta correcta es la ID: 7603be67-17f2-4f8f-b9b9-5cdda3c82baa
    # Que está siendo usada en la ruta con precio_sencillo = $100
    
    caseta_id = "7603be67-17f2-4f8f-b9b9-5cdda3c82baa"
    
    print(f"\n✓ Actualizando caseta Grijalva (ID: {caseta_id})")
    print(f"  Precio SENCILLO a asignar: $100")
    print(f"  Basado en: precio_aplicado en ruta Benito Juárez → Puebla")
    
    # Actualizar con el precio correcto
    success = update_supabase_data(
        "casetas_catalogo",
        caseta_id,
        {
            "precio_sencillo": 100,
            "precio_tracto": 150,  # Estimación: generalmente 50% más que sencillo
            "precio_full": 150     # Estimación similar a tracto para casetas pequeñas
        }
    )
    
    if success:
        print(f"\n✅ CASETA ACTUALIZADA EXITOSAMENTE")
        print(f"\n   Precios asignados:")
        print(f"   - Precio SENCILLO: $100")
        print(f"   - Precio TRACTO: $150")
        print(f"   - Precio FULL: $150")
        print(f"\n   El total de la ruta será recalculado automáticamente")
    else:
        print(f"\n❌ ERROR EN LA ACTUALIZACIÓN")
    
    print("\n" + "=" * 100)

if __name__ == "__main__":
    main()
