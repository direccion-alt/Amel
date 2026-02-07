#!/usr/bin/env python3
"""
Verificar tabla de pagos en Supabase
"""

import requests

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("✅ VERIFICANDO TABLA DE PAGOS EN SUPABASE")
print("=" * 80)

# Intentar obtener datos de la tabla
url = f"{SUPABASE_URL}/rest/v1/pagos?limit=1"
response = requests.get(url, headers=headers)

print(f"\n📊 Status: {response.status_code}")

if response.status_code == 200:
    print("✅ ¡LA TABLA EXISTE Y ESTÁ LISTA!")
    print(f"\n📋 Registros actuales: {len(response.json())}")
    
    # Obtener estructura
    url_info = f"{SUPABASE_URL}/rest/v1/pagos"
    response_info = requests.head(url_info, headers=headers)
    
    print("\n✨ ESTRUCTURA DE LA TABLA:")
    print("""
    ✓ id (UUID) - Identificador único
    ✓ tipo (VARCHAR) - 'cliente' o 'operador'
    ✓ viaje_id (UUID) - Referencia al viaje
    ✓ monto (DECIMAL) - Cantidad pagada
    ✓ fecha_pago (TIMESTAMP) - Cuándo se pagó
    ✓ fecha_registro (TIMESTAMP) - Cuándo se registró
    ✓ referencia (TEXT) - Comprobante, folio, etc
    ✓ notas (TEXT) - Observaciones
    ✓ estado (VARCHAR) - 'completado', 'parcial', 'pendiente'
    """)
    
    print("\n" + "=" * 80)
    print("🎯 PRÓXIMOS PASOS:")
    print("=" * 80)
    print("""
1. Agregamos columnas de estado de pago al dashboard
2. Creamos filtros para pagos pendientes
3. Agregamos modal para registrar pagos
4. Mostramos resumen de pagos

¿Empezamos?
    """)
    
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

print("=" * 80)
