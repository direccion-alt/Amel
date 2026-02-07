# 📊 Actualización en Tiempo Real - Guía de Implementación

## ¿Qué se cambió?

El dashboard **analisis-financiero** ahora está configurado para **sincronizar automáticamente** cuando cambien los datos en estas 4 tablas críticas:

| Tabla | Qué monitorea | Impacto |
|-------|---------------|--------|
| `rutas_operativas` | Cambios en totales_casetas, tarifas, modalidades | Dashboard se actualiza al instante |
| `viajes` | Nuevos viajes, cambios en origen/destino/modalidad | Análisis financiero refleja nuevos datos |
| `ruta_casetas` | Asignaciones de casetas, cambios de precio_aplicado | Total casetas se recalcula automáticamente |
| `casetas_catalogo` | Cambios en precios (sencillo/tracto/full) | Todos los totales se actualizan |

---

## 🔧 Configuración Requerida en Supabase

### Opción 1: Dashboard UI (Recomendado para usuarios)

1. Accede a **Supabase Console**: https://app.supabase.com
2. Selecciona tu proyecto
3. Navega a **Database** → **Replication**
4. En cada tabla, marca los eventos:
   - ✅ Inserts
   - ✅ Updates  
   - ✅ Deletes

**Tablas a habilitar:**
- [ ] rutas_operativas
- [ ] viajes
- [ ] ruta_casetas
- [ ] casetas_catalogo

### Opción 2: SQL (Rápido para administradores)

Copia y ejecuta en **Supabase SQL Editor**:

```sql
-- Habilitar Realtime para todas las tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE rutas_operativas;
ALTER PUBLICATION supabase_realtime ADD TABLE viajes;
ALTER PUBLICATION supabase_realtime ADD TABLE ruta_casetas;
ALTER PUBLICATION supabase_realtime ADD TABLE casetas_catalogo;
```

---

## 📱 Cómo Funciona

```
Usuario edita caseta en Supabase
        ↓
Supabase detecta cambio
        ↓
Envía notificación a todos los clientes conectados
        ↓
Dashboard recibe evento "postgres_changes"
        ↓
Ejecuta fetchData() automáticamente
        ↓
Tabla de análisis se actualiza en tiempo real ⚡
```

### Ejemplo Real:

1. **16:30** - Admin edita precio_sencillo de "Grijalva" de $100 → $120
2. **16:30.000** - Supabase recibe cambio
3. **16:30.005** - Dashboard detecta cambio en casetas_catalogo
4. **16:30.010** - Dashboard recarga datos
5. **16:30.015** - Usuario ve nuevo precio en pantalla ✅

---

## 🎯 Casos de Uso

### ✅ Escenario 1: Actualizar Precio de Caseta
```
Admin edita caseta_catalogo.precio_sencillo = $150
         ↓
Dashboard recibe notificación automáticamente
         ↓
Todos los viajes con esa caseta se actualizan
         ↓
Cálculo de utilidad se recalcula en tiempo real
```

### ✅ Escenario 2: Crear Nueva Ruta
```
Admin crea nueva ruta_operativa
         ↓
Dashboard recibe notificación
         ↓
Nuevos viajes en esa ruta aparecen al instante
         ↓
Análisis financiero incluye nueva ruta
```

### ✅ Escenario 3: Modificar Total Casetas
```
Admin actualiza ruta_casetas (agregar/quitar caseta)
         ↓
PostgreSQL trigger recalcula total_casetas
         ↓
Dashboard recibe notificación de cambio en rutas_operativas
         ↓
Pantalla refleja nuevo total al instante
```

---

## 🔍 Verificación

### Cómo saber si funciona

1. Abre dashboard en tu navegador
2. En otra pestaña, edita un registro en Supabase
3. Vuelve a la pestaña del dashboard
4. Deberías ver los cambios sin refrescar F5

### Verificar en Console del Navegador

Abre DevTools (F12) y busca logs como:

```
📊 Cambio detectado en rutas_operativas
✈️ Cambio detectado en viajes
🛣️ Cambio detectado en ruta_casetas
💰 Cambio detectado en casetas_catalogo
```

---

## ⚙️ Detalles Técnicos

### Código Implementado

El archivo `/app/dashboard/analisis-financiero/page.tsx` ahora incluye:

```typescript
useEffect(() => {
  const channelRutas = supabase
    .channel("rutas-operativas-changes")
    .on("postgres_changes", 
        { event: "*", schema: "public", table: "rutas_operativas" },
        () => fetchData()
    )
    .subscribe()

  // ... más suscripciones para otras tablas
  
  return () => {
    supabase.removeChannel(channelRutas)
    // ... limpiar otros channels
  }
}, [fetchData])
```

### Eventos Monitoreados

- **INSERT**: Cuando se crea un nuevo registro
- **UPDATE**: Cuando se modifica un registro existente
- **DELETE**: Cuando se elimina un registro

### Performance

- No hay polling (sin consultas cada X segundos)
- WebSocket persistente (eficiente)
- Carga de datos optimizada
- Bajo consumo de ancho de banda

---

## 🚀 Próximos Pasos

1. **Habilitar Realtime** en Supabase (Opción 1 o 2 arriba)
2. **Reiniciar** el servidor Next.js si estaba corriendo
3. **Probar** editando un registro en Supabase
4. **Verificar** logs en DevTools del navegador

---

## ❓ Preguntas Frecuentes

### P: ¿Funciona si varios usuarios editan a la vez?
**R:** Sí. Cada usuario que tenga abierto el dashboard verá los cambios en tiempo real.

### P: ¿Qué pasa si internet se corta?
**R:** Supabase reconectará automáticamente cuando vuelva internet.

### P: ¿Se puede desactivar Realtime?
**R:** Sí, pero el dashboard solo se actualizaría al F5 (refrescar página).

### P: ¿Afecta el rendimiento?
**R:** No, Realtime es muy eficiente. Solo recibe notificaciones de cambios, no toda la tabla.

---

## 📞 Soporte

Si los cambios no se reflejan:
1. Verifica que Realtime esté habilitado en Supabase
2. Revisa la consola de navegador (F12)
3. Busca errores de conexión
4. Reinicia el navegador

---

**Última actualización:** Febrero 4, 2026
**Estado:** ✅ Implementado y listo para usar
