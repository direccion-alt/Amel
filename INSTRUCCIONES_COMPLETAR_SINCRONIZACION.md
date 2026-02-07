# Instrucciones para Completar la Sincronización - Caseta Grijalva

## Situación Actual

Hay una caseta llamada **"Grijalva"** que está siendo usada en 2 rutas con modalidad **SENCILLO**, pero no tiene un precio SENCILLO definido en el catálogo:

1. **Ruta 1**: Benito Juárez, Q. Roo → Puebla, Pue
2. **Ruta 2**: Solidaridad, Q. Roo → Puebla, Pue

---

## Solución

### Opción A: Vía Dashboard de Administración

1. Ir a la sección de **Catálogo de Casetas** en el dashboard
2. Buscar **"Grijalva"**
3. Editar la caseta
4. En el campo **"Precio SENCILLO"**, ingresar el valor correspondiente
5. Guardar los cambios

### Opción B: Vía SQL Directo (si hay acceso a Supabase)

```sql
-- Reemplazar XX con el precio correcto
UPDATE public.casetas_catalogo
SET precio_sencillo = XX
WHERE nombre = 'Grijalva' AND precio_sencillo IS NULL;
```

### Opción C: Usar Script Python

Crear un archivo `asignar_precio_grijalva.py` con:

```python
#!/usr/bin/env python3
import json
import urllib.request

SUPABASE_URL = "https://hgkzcdmagdtjgxaniswr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Buscar caseta Grijalva
url = f"{SUPABASE_URL}/rest/v1/casetas_catalogo?nombre=ilike.Grijalva"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    casetas = json.loads(response.read().decode())
    
    if casetas:
        caseta_id = casetas[0]['id']
        
        # Actualizar con nuevo precio
        update_url = f"{SUPABASE_URL}/rest/v1/casetas_catalogo?id=eq.{caseta_id}"
        update_data = {"precio_sencillo": 100}  # Cambiar 100 por el valor correcto
        
        req = urllib.request.Request(
            update_url,
            data=json.dumps(update_data).encode(),
            headers={**headers, "Prefer": "return=minimal"},
            method='PATCH'
        )
        
        with urllib.request.urlopen(req) as response:
            print("✅ Precio actualizado")
```

---

## Verificación del Resultado

Una vez definido el precio para Grijalva, ejecutar:

```bash
python verificacion_final.py
```

**Resultado esperado**:
- ✅ Rutas con totales correctos: 70/70
- ❌ Asignaciones sin precio: 0

---

## Valores de Referencia

Para ayudarte a decidir qué precio asignar a Grijalva (SENCILLO), aquí están los precios de casetas similares:

| Caseta | TRACTO | SENCILLO | FULL |
|--------|--------|----------|------|
| Acayucan | $685 | $495 | $544 |
| Dovali | $206 | $108 | - |
| Nacajuca | $324 | $210 | - |
| Sanchez Magallanes | $403 | $262 | - |
| Usumacinta | $150 | $100 | - |

**Nota**: Grijalva es una caseta en la zona de Tabasco (entre Usumacinta y Nacajuca), por lo que un rango de **$100-$150** sería razonable para SENCILLO.

---

## Después de Completar

1. El sistema **recalculará automáticamente** los totales gracias a los triggers en PostgreSQL
2. El análisis financiero reflejará los valores correctos
3. Se puede monitorear desde el dashboard

---

**Contacto**: Si necesitas ayuda adicional, revisar los logs en la tabla `ruta_casetas` para verificar que el precio se aplicó correctamente.
