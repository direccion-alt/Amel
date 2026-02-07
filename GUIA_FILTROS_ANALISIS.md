# 🔍 Guía de Filtros - Análisis Financiero

## ¿Qué se agregó?

Se implementó un sistema completo de filtros en la sección de **Análisis Financiero** para que puedas filtrar datos por múltiples criterios simultáneamente.

---

## 📊 Filtros Disponibles

| Filtro | Descripción | Ejemplo |
|--------|-------------|---------|
| **Unidad** | Filtra por número/código de unidad (ECONÓMICO) | `UA-001`, `AB-50` |
| **Cliente** | Busca clientes por nombre (búsqueda parcial) | `Grijalva`, `Ternium` |
| **Modalidad** | Filtra por tipo de modalidad | FULL, SENCILLO, TRACTO |
| **Estado** | Filtra por estado de carga | CARGADO, VACIO |
| **Origen** | Busca por ciudad/lugar de origen | `Coatzacoalcos`, `México` |
| **Destino** | Busca por ciudad/lugar destino | `Puebla`, `Veracruz` |
| **Min Utilidad** | Filtra viajes con utilidad mínima | `500`, `0`, `-1000` |
| **Max Utilidad** | Filtra viajes con utilidad máxima | `50000`, `100000` |

---

## 🎯 Cómo Usar los Filtros

### Ejemplo 1: Encontrar viajes de una unidad específica
1. Escribe en campo **Unidad**: `UA-001`
2. Los resultados mostrarán solo viajes de esa unidad
3. Muestra: "Mostrando 5 de 148 viajes"

### Ejemplo 2: Encontrar viajes rentables
1. Escribe en campo **Min Utilidad**: `5000`
2. Solo muestra viajes con utilidad >= $5000
3. Combinable con otros filtros (ej: Cliente = Grijalva, Modalidad = FULL)

### Ejemplo 3: Viajes de una ruta específica
1. Escribe en **Origen**: `Coatzacoalcos`
2. Escribe en **Destino**: `Puebla`
3. Modalidad: selecciona `FULL`
4. Estado: selecciona `VACIO`
5. Verás solo viajes que coincidan con todos estos criterios

### Ejemplo 4: Encontrar pérdidas
1. Escribe en campo **Max Utilidad**: `0`
2. Muestra todos los viajes con utilidad negativa (pérdidas)
3. Ayuda a identificar rutas no rentables

---

## ⚡ Características Especiales

### Búsqueda Parcial (Case-Insensitive)
- Los campos **Unidad**, **Cliente**, **Origen**, **Destino** buscan parcialmente
- No necesita ser exacto
- No importa mayúsculas/minúsculas
- Ejemplo: escribir `coatz` encuentra `Coatzacoalcos, Ver`

### Filtros Exactos (Dropdowns)
- **Modalidad** y **Estado**: seleccionar opciones exactas
- Solo se aplican si seleccionas un valor

### Filtros Numéricos (Min/Max)
- **Min Utilidad** y **Max Utilidad**: rangos numéricos
- Pueden ser positivos o negativos
- Puedes usar solo uno o ambos

### Contador de Resultados
- En la parte inferior de los filtros dice:
  ```
  Mostrando X de Y viajes
  ```
- X = viajes que coinciden con filtros
- Y = total de viajes en la base de datos

---

## 📋 Combinaciones Útiles

### Para análisis por cliente:
```
Cliente: Grijalva
Modalidad: FULL
→ Ver todos los viajes FULL de Grijalva
```

### Para identificar problemas:
```
Max Utilidad: 0
Estado: VACIO
→ Ver viajes vacíos con pérdidas
```

### Para análisis de rentabilidad:
```
Min Utilidad: 3000
Modalidad: FULL
→ Ver viajes FULL rentables (utilidad >= $3000)
```

### Para ruta específica:
```
Origen: Benito Juárez
Destino: Puebla
Modalidad: SENCILLO
Estado: CARGADO
→ Análisis específico de una ruta
```

---

## 🔄 Limpiar Filtros

Para limpiar todos los filtros y ver todos los viajes de nuevo:
1. Borra el contenido de todos los campos de entrada
2. Selecciona opción en blanco en los dropdowns
3. Click en el campo y vacía con Delete/Backspace

---

## 💡 Tips y Trucos

**Tip 1:** Combina filtros para análisis más precisos
- Un filtro es bueno, 2-3 filtros es mejor

**Tip 2:** Usa Min/Max Utilidad para segmentación
- Min: $5000 = Viajes muy rentables
- Max: $0 = Viajes con pérdida

**Tip 3:** Ordena mentalmente los resultados
- Los viajes aparecen en orden de carga (viajes más recientes primero)

**Tip 4:** Exporta datos (si necesitas)
- Puedes copiar y pegar datos de la tabla a Excel

---

**Última actualización:** Febrero 4, 2026
**Estado:** ✅ Implementado y funcionando
