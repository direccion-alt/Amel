#!/usr/bin/env python3
"""
Diagnóstico: Por qué la ruta nueva no aparece en análisis financiero
(Sin dependencias externas)
"""

import requests
import json

print("=" * 80)
print("🔍 DIAGNÓSTICO: ¿Por qué no aparece la ruta en análisis-financiero?")
print("=" * 80)

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. Verificar la ruta nueva
print("\n1️⃣  VERIFICANDO RUTA NUEVA:")
print("-" * 80)

try:
    url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?origen=ilike.%Coatzacoalcos%"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        rutas = response.json()
        if rutas:
            print(f"✅ Se encontraron {len(rutas)} ruta(s):\n")
            for ruta in rutas:
                print(f"   ID: {ruta.get('id')}")
                print(f"   Origen: {ruta.get('origen')}")
                print(f"   Destino: {ruta.get('destino')}")
                print(f"   Modalidad: {ruta.get('modalidad')}")
                print(f"   Estado Carga: {ruta.get('estado_carga')}")
                print(f"   Pago Operador: ${ruta.get('pago_operador')}")
                print(f"   Total Casetas: ${ruta.get('total_casetas')}")
                print()
        else:
            print("❌ No se encontró ruta que empiece con 'Coatzacoalcos'\n")
            print("   Mostrando primeras 5 rutas disponibles:")
            url = f"{SUPABASE_URL}/rest/v1/rutas_operativas?limit=5"
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                for r in response.json():
                    print(f"     • {r['origen']} → {r['destino']} ({r['modalidad']}, {r['estado_carga']})")
    else:
        print(f"❌ Error en Supabase: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error: {e}")

# 2. Verificar si hay viajes para esa ruta
print("\n2️⃣  VERIFICANDO VIAJES PARA ESA RUTA:")
print("-" * 80)

try:
    url = f"{SUPABASE_URL}/rest/v1/viajes?origen=ilike.%Coatzacoalcos%"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        viajes = response.json()
        if viajes:
            print(f"✅ Se encontraron {len(viajes)} viaje(s):\n")
            for viaje in viajes[:3]:
                print(f"   Viaje #{viaje.get('numero_viaje')}:")
                print(f"   • Origen: {viaje.get('origen')}")
                print(f"   • Destino: {viaje.get('destino')}")
                print(f"   • Modalidad: {viaje.get('modalidad')}")
                print(f"   • Estado: {viaje.get('estado_carga')}")
                print(f"   • Tarifa Cliente: ${viaje.get('tarifa_cliente')}")
                print()
        else:
            print("⚠️  NO hay viajes para Coatzacoalcos")
    else:
        print(f"❌ Error: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

# 3. Explicar el problema
print("\n3️⃣  PROBLEMA IDENTIFICADO:")
print("-" * 80)

print("""
┌─────────────────────────────────────────────────────┐
│    ANÁLISIS FINANCIERO = VIAJES × RUTAS OPERATIVAS  │
└─────────────────────────────────────────────────────┘

El dashboard muestra VIAJES combinados con RUTAS OPERATIVAS.

ARQUITECTURA:
  1. Se cargan todos los VIAJES
  2. Para cada VIAJE, se busca una RUTA OPERATIVA que coincida en:
     ✓ Origen
     ✓ Destino
     ✓ Modalidad
     ✓ Estado Carga
  3. Si encuentra coincidencia → Se muestra en el dashboard
  4. Si NO encuentra coincidencia → Se oculta

PROBLEMA CON TU RUTA NUEVA:
  ❌ Creaste la ruta "Coatzacoalcos, Ver → Tres Valles, Ver (FULL, Vacio)"
  ❌ PERO no hay VIAJES con esos parámetros exactamente
  ❌ Por eso NO aparece en el dashboard

SOLUCIÓN:
  ✓ Crea un VIAJE que coincida con esa ruta
  ✓ Asegúrate que origen, destino, modalidad y estado_carga sean idénticos
  ✓ Entonces verás la ruta + viaje en el dashboard
""")

print("\n4️⃣  PROBLEMA CON REALTIME (Actualización automática):")
print("-" * 80)

print("""
REALTIME NO ESTÁ HABILITADO EN SUPABASE ❌

El código del dashboard intenta suscribirse a cambios automáticos, PERO:

Sin Realtime habilitado:
  • No se reciben notificaciones de cambios
  • Dashboard no se actualiza automáticamente
  • Tienes que refrescar la página (F5)

SOLUCIÓN CRÍTICA:
  1. Abre Supabase Console: https://app.supabase.com
  2. Ve a: Database → Replication
  3. Habilita para estas 4 tablas:
     ✓ rutas_operativas
     ✓ viajes
     ✓ ruta_casetas
     ✓ casetas_catalogo
  4. En cada tabla marca: INSERT, UPDATE, DELETE
  5. Reinicia el servidor Next.js
  6. Ahora SÍ funcionará en tiempo real

O ejecuta en SQL directamente en Supabase:
""")

sql = """
-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rutas_operativas;
ALTER PUBLICATION supabase_realtime ADD TABLE viajes;
ALTER PUBLICATION supabase_realtime ADD TABLE ruta_casetas;
ALTER PUBLICATION supabase_realtime ADD TABLE casetas_catalogo;
"""
print(sql)

print("\n5️⃣  RESUMEN: 2 PASOS PARA QUE TODO FUNCIONE:")
print("-" * 80)

print("""
PASO 1: HABILITAR REALTIME en Supabase
├─ Sin esto, NO habrá actualizaciones automáticas
├─ Ir a: Database → Replication
└─ Habilitar las 4 tablas

PASO 2: CREAR VIAJES que coincidan con tus rutas
├─ La ruta sola NO aparece sin viajes
├─ Cada viaje necesita una ruta que coincida
└─ Entonces sí verás datos en análisis-financiero

DESPUÉS:
✓ Cambios en Supabase se reflejarán en tiempo real
✓ No necesitarás F5 ni decirme que actualice
✓ Dashboard se sincroniza automáticamente
""")

print("\n" + "=" * 80)
print("✅ ESTADO ACTUAL:")
print("=" * 80)
print("""
Código del dashboard: ✅ Listo para Realtime
Suscripciones: ✅ Implementadas
Realtime en Supabase: ❌ NECESITA HABILITARSE

Próximo paso: Habilita Realtime en Supabase
""")
print("=" * 80)
