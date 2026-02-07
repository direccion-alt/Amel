"""
SCRIPT DE MIGRACIÓN: Cargar Mantenimientos Históricos a Supabase
Fecha: 2026-02-05
Propósito: Importar registros antiguos de Excel/CSV a la nueva tabla
"""

from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import os

# ============ CONFIGURACIÓN ============
SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============ PASO 1: LEER TU ARCHIVO HISTÓRICO ============
# Ajusta la ruta a tu archivo Excel/CSV
ARCHIVO_HISTORICO = r"C:\Users\PC1\Desktop\RUTA_A_TU_ARCHIVO.xlsx"  # <-- CAMBIAR AQUÍ

# Si es Excel:
try:
    df = pd.read_excel(ARCHIVO_HISTORICO)
    print(f"✅ Archivo cargado: {len(df)} registros encontrados")
    print(f"📋 Columnas detectadas: {list(df.columns)}")
except FileNotFoundError:
    print(f"❌ Archivo no encontrado: {ARCHIVO_HISTORICO}")
    print("\n📝 INSTRUCCIONES:")
    print("1. Coloca tu archivo Excel de mantenimientos en el escritorio")
    print("2. Cambia la variable ARCHIVO_HISTORICO con la ruta correcta")
    print("3. Ejecuta este script nuevamente")
    exit()

# ============ PASO 2: MAPEAR COLUMNAS ============
# Ajusta este diccionario según los nombres de TUS columnas
MAPEO_COLUMNAS = {
    # 'TU_COLUMNA_EXCEL': 'nombre_campo_supabase'
    'Unidad': 'economico',
    'Fecha': 'fecha_servicio',
    'Tipo': 'tipo_mantenimiento',  # Debe ser: PREVENTIVO, CORRECTIVO, EMERGENCIA
    'Categoría': 'categoria',  # Debe ser: REFACCIONES, MANO DE OBRA, VULCANIZADORA, etc.
    'KM': 'km_actual',
    'Descripción': 'descripcion',
    'Taller': 'proveedor',
    'Monto Refacciones': 'monto_refacciones',
    'Monto Mano Obra': 'monto_mano_obra',
    'Folio': 'folio_ticket',
    'Notas': 'notas'
}

# ============ PASO 3: TRANSFORMAR DATOS ============
def limpiar_y_transformar(df):
    """Limpia y transforma el DataFrame para que coincida con el esquema de Supabase"""
    
    # Renombrar columnas
    df_limpio = df.rename(columns=MAPEO_COLUMNAS)
    
    # Convertir fechas
    if 'fecha_servicio' in df_limpio.columns:
        df_limpio['fecha_servicio'] = pd.to_datetime(df_limpio['fecha_servicio']).dt.strftime('%Y-%m-%d')
    
    # Convertir números
    for col in ['km_actual', 'monto_refacciones', 'monto_mano_obra']:
        if col in df_limpio.columns:
            df_limpio[col] = pd.to_numeric(df_limpio[col], errors='coerce').fillna(0)
    
    # Normalizar tipo_mantenimiento
    if 'tipo_mantenimiento' in df_limpio.columns:
        df_limpio['tipo_mantenimiento'] = df_limpio['tipo_mantenimiento'].str.upper()
        df_limpio['tipo_mantenimiento'] = df_limpio['tipo_mantenimiento'].map({
            'PREVENTIVO': 'PREVENTIVO',
            'PREV': 'PREVENTIVO',
            'CORRECTIVO': 'CORRECTIVO',
            'CORR': 'CORRECTIVO',
            'EMERGENCIA': 'EMERGENCIA',
            'EMERG': 'EMERGENCIA'
        }).fillna('CORRECTIVO')
    
    # Normalizar categoría
    if 'categoria' in df_limpio.columns:
        df_limpio['categoria'] = df_limpio['categoria'].str.upper()
        # Puedes agregar más mapeos según tus datos
        df_limpio['categoria'] = df_limpio['categoria'].fillna('OTRO')
    
    # Calcular km_proximo_servicio (25,000 km después)
    if 'km_actual' in df_limpio.columns:
        df_limpio['km_proximo_servicio'] = df_limpio['km_actual'] + 25000
    
    # Agregar campos por defecto
    df_limpio['estatus'] = 'COMPLETADO'
    df_limpio['usuario_registro'] = 'MIGRACION_HISTORICA'
    
    # Eliminar NaN
    df_limpio = df_limpio.fillna({
        'descripcion': 'Sin descripción',
        'proveedor': 'No especificado',
        'monto_refacciones': 0,
        'monto_mano_obra': 0,
        'notas': ''
    })
    
    return df_limpio

# ============ PASO 4: CARGAR A SUPABASE ============
def cargar_mantenimientos(df):
    """Inserta los registros en Supabase"""
    registros = df.to_dict('records')
    
    print(f"\n📤 Cargando {len(registros)} registros a Supabase...")
    
    exitos = 0
    errores = 0
    
    for i, registro in enumerate(registros, 1):
        try:
            response = supabase.table('mantenimientos').insert(registro).execute()
            exitos += 1
            print(f"  ✅ [{i}/{len(registros)}] {registro.get('economico', 'N/A')} - {registro.get('fecha_servicio', 'N/A')}")
        except Exception as e:
            errores += 1
            print(f"  ❌ [{i}/{len(registros)}] ERROR: {str(e)}")
    
    print(f"\n📊 RESUMEN:")
    print(f"  ✅ Exitosos: {exitos}")
    print(f"  ❌ Errores: {errores}")
    print(f"  📈 Total: {len(registros)}")

# ============ EJECUCIÓN PRINCIPAL ============
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔧 MIGRACIÓN DE MANTENIMIENTOS HISTÓRICOS")
    print("="*60 + "\n")
    
    # Mostrar preview de los datos
    print("📋 PREVIEW DE DATOS ORIGINALES:")
    print(df.head())
    print(f"\nTotal de registros: {len(df)}\n")
    
    # Transformar
    df_limpio = limpiar_y_transformar(df)
    
    print("\n📋 PREVIEW DE DATOS TRANSFORMADOS:")
    print(df_limpio.head())
    
    # Confirmar antes de cargar
    confirmacion = input("\n¿Proceder con la carga? (SI/NO): ").strip().upper()
    
    if confirmacion == "SI":
        cargar_mantenimientos(df_limpio)
        print("\n✅ Migración completada!")
    else:
        print("\n❌ Migración cancelada por el usuario")

# ============ NOTAS ============
# 1. Ejecutar primero el script SQL 020_create_mantenimientos.sql
# 2. Ajustar ARCHIVO_HISTORICO con la ruta de tu Excel/CSV
# 3. Ajustar MAPEO_COLUMNAS según los nombres en tu archivo
# 4. Ejecutar: python migrar_mantenimientos.py
# 5. Los comprobantes históricos se pueden cargar manualmente después
