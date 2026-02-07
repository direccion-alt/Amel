#!/usr/bin/env python3
"""
Script para verificar precios de casetas problemáticas
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZxqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"

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
    # Buscar caseta Grijalva
    casetas = fetch_supabase_data("casetas_catalogo", "&nombre=ilike.Grijalva")
    
    print("=" * 100)
    print("INFORMACIÓN DE CASETA 'GRIJALVA'")
    print("=" * 100)
    
    for caseta in casetas:
        print(f"\nCaseta: {caseta.get('nombre')}")
        print(f"  ID: {caseta.get('id')}")
        print(f"  Precio TRACTO: ${caseta.get('precio_tracto', 'N/A')}")
        print(f"  Precio SENCILLO: ${caseta.get('precio_sencillo', 'N/A')}")
        print(f"  Precio FULL: ${caseta.get('precio_full', 'N/A')}")
        print(f"  Activo: {caseta.get('activo', True)}")

if __name__ == "__main__":
    main()
