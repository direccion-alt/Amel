# 🤖 ESCANEO DE FACTURAS CON IA - GUÍA DE IMPLEMENTACIÓN

**Fecha:** 2026-02-05  
**Tecnología:** Google Gemini 1.5 Flash Vision  
**Tiempo:** 5 minutos

---

## 🚀 PASOS DE CONFIGURACIÓN

### 1️⃣ Obtener API Key de Gemini (2 minutos)

1. Ve a: https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Click en **"Create API Key"**
4. Copia la clave generada

### 2️⃣ Configurar Variable de Entorno (1 minuto)

1. En la raíz del proyecto, crea/edita el archivo `.env.local`:
   ```bash
   cd "c:\Users\PC1\Desktop\Pagina amel"
   ```

2. Agrega tu API key:
   ```env
   GEMINI_API_KEY=AIzaSy...tu-clave-aqui
   ```

3. Guarda el archivo

### 3️⃣ Reiniciar el Servidor (1 minuto)

```powershell
# Detén el servidor actual (Ctrl+C)
# Luego inicia nuevamente:
npm run dev
```

### 4️⃣ Probar la Funcionalidad (2 minutos)

1. Ve a: http://localhost:3000/dashboard/mantenimiento
2. Click en **"NUEVO SERVICIO"**
3. Busca el botón morado: **"🤖 ESCANEAR FACTURA CON IA"**
4. Sube una foto/PDF de una factura de taller
5. ¡Mira cómo se autocompleta el formulario! ✨

---

## ✨ CÓMO FUNCIONA

### Flujo del Usuario:

1. **Usuario sube factura** → Foto o PDF
2. **Gemini lee el documento** → 3-5 segundos
3. **Extrae información:**
   - Proveedor/Taller
   - Folio/Ticket
   - Fecha
   - Montos (Refacciones, Mano de Obra)
   - Descripción del servicio
   - Categoría sugerida
   - Tipo de mantenimiento
4. **Autocompleta formulario** → Instantáneo
5. **Usuario revisa y confirma** → Puede editar si algo está mal
6. **Guarda el registro** → Con comprobante adjunto

---

## 📊 CAPACIDADES DE LA IA

### ✅ Lo que Gemini puede detectar:

- ✅ Nombres de talleres/proveedores
- ✅ Folios de facturas (FAC-2026-001234)
- ✅ Fechas en cualquier formato
- ✅ Montos en pesos mexicanos ($)
- ✅ Subtotales, IVA, totales
- ✅ Descripciones de servicios
- ✅ Conceptos (balatas, aceite, filtros, etc.)
- ✅ Clasificación automática:
  - "Balatas" → Categoría: FRENOS
  - "Aceite SAE 15W40" → Categoría: ACEITE Y FILTROS
  - "Llantas Michelin" → Categoría: VULCANIZADORA
  - "Batería LTH" → Categoría: ELECTRICO

### ⚠️ Limitaciones:

- Si la factura está muy borrosa, puede fallar
- Si es una factura en inglés, funciona pero puede confundirse
- Necesita conexión a internet

---

## 💰 COSTOS Y LÍMITES

### Gemini 1.5 Flash (modelo usado):

- **Gratis hasta:** 1,500 solicitudes/día
- **Costo después:** $0.00035 por imagen
- **Tiempo de respuesta:** 2-5 segundos

### Ejemplo de uso mensual:

Si escaneas **100 facturas/mes**:
- **Costo:** $0 (estás muy debajo del límite gratuito)
- **Tiempo ahorrado:** ~5 horas/mes

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "API key not configured"
**Solución:** 
1. Verifica que `.env.local` exista
2. Confirma que la variable sea `GEMINI_API_KEY=tu-clave`
3. Reinicia el servidor con `npm run dev`

### Error: "Failed to fetch"
**Solución:** 
1. Verifica tu conexión a internet
2. Confirma que tu API key sea válida
3. Revisa que no hayas excedido el límite gratuito

### La IA no extrae bien los datos
**Solución:** 
1. Asegúrate de que la imagen sea clara
2. Si es PDF, verifica que no esté protegido
3. Prueba con otra factura más legible
4. Usa el modo manual si la factura es muy compleja

### El botón dice "ESCANEANDO" pero no termina
**Solución:** 
1. Espera hasta 10 segundos (puede tardar en archivos grandes)
2. Revisa la consola del navegador (F12) por errores
3. Verifica que el archivo sea menor a 10 MB

---

## 🎯 MEJORAS FUTURAS (Opcional)

Si quieres mejorar el sistema, puedes agregar:

1. **Confianza de la IA**: Mostrar porcentaje de certeza
2. **Revisión antes de aplicar**: Popup con preview de cambios
3. **Aprendizaje**: Corregir errores para mejorar futuras lecturas
4. **Múltiples facturas**: Escanear varias a la vez
5. **XML de CFDI**: Leer facturas electrónicas directamente

---

## 📝 EJEMPLO DE FACTURA

Para probar, puedes usar cualquier factura de taller que tenga:

```
TALLER MECÁNICO GARCÍA
Av. Reforma #123, Monterrey, NL
Tel: 811-234-5678

FECHA: 05/02/2026
FOLIO: FAC-2026-000456

SERVICIOS:
- Cambio de aceite sintético 15W40   $450.00
- Filtro de aceite                   $180.00
- Filtro de aire                     $220.00
- Mano de obra                       $350.00

SUBTOTAL:                          $1,200.00
IVA (16%):                           $192.00
TOTAL:                            $1,392.00
```

La IA detectará automáticamente:
- Proveedor: "TALLER MECÁNICO GARCÍA"
- Folio: "FAC-2026-000456"
- Fecha: "2026-02-05"
- Refacciones: $850
- Mano de obra: $350
- Categoría: "ACEITE Y FILTROS"
- Tipo: "PREVENTIVO"

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de usar en producción:

- [ ] API Key de Gemini configurada
- [ ] Variable `GEMINI_API_KEY` en `.env.local`
- [ ] Servidor reiniciado después de agregar la clave
- [ ] Botón "🤖 ESCANEAR FACTURA CON IA" visible en el formulario
- [ ] Prueba con factura real completada exitosamente
- [ ] Campos se autocompletaron correctamente
- [ ] Archivo adjuntado junto con los datos

---

**¡Listo! Ahora tienes escaneo automático de facturas con IA.** 🎉

El sistema ahorra tiempo, reduce errores de captura y mantiene trazabilidad completa.
