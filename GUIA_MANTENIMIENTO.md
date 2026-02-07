# 🔧 SISTEMA DE MANTENIMIENTO AMEL - GUÍA DE IMPLEMENTACIÓN

**Fecha:** 2026-02-05  
**Estado:** Listo para implementar  
**Tiempo estimado:** 20 minutos

---

## 📋 PASO 1: CREAR LA TABLA EN SUPABASE (5 minutos)

### 1.1 Ir al SQL Editor
1. Abrir Supabase Dashboard: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** (icono de base de datos en el menú)
4. Click en **New Query**

### 1.2 Ejecutar el script
1. Abrir el archivo: `scripts/020_create_mantenimientos.sql`
2. Copiar **TODO** el contenido
3. Pegarlo en el SQL Editor de Supabase
4. Click en **RUN** (botón verde)

✅ **Resultado esperado:**
```
Success. No rows returned
```

### 1.3 Verificar la tabla
```sql
-- Ejecutar esta consulta para verificar:
SELECT * FROM mantenimientos LIMIT 1;
```

---

## 📦 PASO 2: CREAR BUCKET DE STORAGE (3 minutos)

### 2.1 Crear bucket desde la UI
1. En Supabase Dashboard, ir a **Storage** (menú lateral)
2. Click en **New Bucket**
3. Configurar:
   - **Name:** `comprobantes-mantenimiento`
   - **Public:** ❌ NO (mantener privado)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** 
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
4. Click en **Create Bucket**

### 2.2 Configurar políticas de acceso
1. Abrir SQL Editor nuevamente
2. Ejecutar el archivo: `scripts/021_create_storage_comprobantes.sql`
3. Click en **RUN**

✅ **Resultado esperado:**
```
Success. 4 rows affected
```

---

## 📊 PASO 3: MIGRAR DATOS HISTÓRICOS (Opcional - 10 minutos)

### 3.1 Preparar tu archivo de datos
1. Exporta tu base de datos actual a Excel (.xlsx) o CSV
2. Asegúrate de tener estas columnas (o similares):
   - Unidad / Economico
   - Fecha
   - Tipo (Preventivo/Correctivo/etc.)
   - Categoría
   - KM
   - Descripción
   - Taller/Proveedor
   - Monto

### 3.2 Configurar script de migración
1. Abrir: `scripts/migrar_mantenimientos.py`
2. Editar línea 14:
   ```python
   ARCHIVO_HISTORICO = r"C:\Users\PC1\Desktop\TU_ARCHIVO.xlsx"
   ```
3. Ajustar el diccionario `MAPEO_COLUMNAS` (líneas 35-47) según tus nombres de columnas

### 3.3 Ejecutar migración
```powershell
cd "c:\Users\PC1\Desktop\Pagina amel\scripts"
python migrar_mantenimientos.py
```

### 3.4 Confirmar cuando pregunte
```
¿Proceder con la carga? (SI/NO): SI
```

✅ **Resultado esperado:**
```
✅ Exitosos: 150
❌ Errores: 0
📈 Total: 150
```

---

## 🎨 PASO 4: ACCEDER AL DASHBOARD (2 minutos)

### 4.1 Abrir en el navegador
```
http://localhost:3000/dashboard/mantenimiento
```

### 4.2 Verificar que funcione
- ✅ Deberías ver las 4 tarjetas de estadísticas
- ✅ La tabla con tus mantenimientos (si ya migraste datos)
- ✅ El botón "NUEVO SERVICIO"

---

## 🧪 PASO 5: PROBAR FUNCIONALIDAD (5 minutos)

### 5.1 Crear un registro de prueba
1. Click en **NUEVO SERVICIO**
2. Llenar el formulario:
   - **Unidad:** Selecciona cualquiera
   - **Fecha:** Hoy
   - **KM Actual:** 145000
   - **Tipo:** PREVENTIVO
   - **Categoría:** ACEITE Y FILTROS
   - **Descripción:** "Prueba de sistema - Cambio de aceite sintético"
   - **Proveedor:** "TALLER TEST"
   - **Monto Refacciones:** 3000
   - **Monto Mano de Obra:** 500
3. **Adjuntar comprobante:**
   - Click en "SELECCIONAR ARCHIVO"
   - Sube un PDF o imagen de prueba
4. Click en **REGISTRAR SERVICIO**

✅ **Resultado esperado:**
```
✅ Mantenimiento registrado exitosamente
```

### 5.2 Verificar el comprobante
1. En la tabla, click en el ícono de ojo (👁️) en la columna "Comprobante"
2. Debería abrir el archivo en una nueva pestaña

### 5.3 Verificar en Supabase
1. Ir a **Storage > comprobantes-mantenimiento**
2. Navegar a la carpeta: `2026/02/`
3. Deberías ver tu archivo subido

---

## ✅ CHECKLIST FINAL

Antes de usar en producción, verifica:

- [ ] Tabla `mantenimientos` creada correctamente
- [ ] Bucket `comprobantes-mantenimiento` configurado
- [ ] Políticas de Storage aplicadas
- [ ] Datos históricos migrados (si aplica)
- [ ] Dashboard accesible en `/dashboard/mantenimiento`
- [ ] Formulario de nuevo servicio funciona
- [ ] Upload de comprobantes funciona
- [ ] Filtros funcionan correctamente
- [ ] Estadísticas se calculan bien
- [ ] Modal de detalle muestra información completa

---

## 🎯 FUNCIONALIDADES DEL SISTEMA

### ✨ Características implementadas:

1. **Registro completo de mantenimientos**
   - Preventivos, correctivos, emergencias
   - 8 categorías predefinidas
   - Desglose de costos (refacciones, mano de obra, otros)
   - Cálculo automático de IVA y total

2. **Comprobantes digitales**
   - Upload de PDF/JPG/PNG (máx 10 MB)
   - Almacenamiento seguro en Supabase Storage
   - Visualización directa desde el dashboard
   - Organización automática por año/mes

3. **Control de kilometraje**
   - Registro de KM actual en cada servicio
   - Cálculo automático del próximo servicio (+25,000 km)
   - Vista de próximos mantenimientos

4. **Estadísticas en tiempo real**
   - Total de servicios realizados
   - Total invertido en mantenimiento
   - Promedio por servicio
   - Servicios pendientes

5. **Filtros avanzados**
   - Por unidad
   - Por categoría
   - Por tipo de mantenimiento

6. **Historial por unidad**
   - Todos los servicios de una unidad
   - Costos acumulados
   - Último servicio realizado

---

## 🔐 SEGURIDAD

- ✅ Comprobantes almacenados de forma privada
- ✅ Solo usuarios autenticados pueden acceder
- ✅ Row Level Security (RLS) activado
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño de archivo (10 MB)

---

## 📱 PRÓXIMAS MEJORAS (Opcionales)

### Alertas automáticas
- Notificar cuando una unidad llegue a 24,000 km (1,000 antes del servicio)
- Email/WhatsApp con recordatorio

### Análisis avanzado
- Costo promedio por categoría
- Unidades más costosas de mantener
- Tendencias mensuales de gastos

### Garantías
- Control de servicios en garantía
- Alertas de vencimiento de garantía

### Exportación de reportes
- Descargar historial en Excel
- Reporte mensual de gastos
- Resumen anual por unidad

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Table mantenimientos does not exist"
**Solución:** Ejecutar nuevamente el script `020_create_mantenimientos.sql`

### Error: "Bucket not found"
**Solución:** Crear el bucket manualmente desde Storage UI

### Error al subir archivo: "Payload too large"
**Solución:** El archivo excede 10 MB. Reducir tamaño o comprimir

### No se ven los comprobantes
**Solución:** Verificar que las políticas de Storage estén aplicadas

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Revisa los logs del navegador (F12 > Console)
2. Verifica que todos los scripts SQL se hayan ejecutado correctamente
3. Confirma que el bucket de Storage exista

---

**¡Listo! El sistema de mantenimiento está completo y funcional.** 🎉

