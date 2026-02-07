"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, RefreshCw, History } from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabase = createClient()

const MODALIDADES = ["TRACTO", "SENCILLO", "FULL"]

type Caseta = {
  id: string
  nombre: string
  precio_tracto: number
  precio_sencillo: number
  precio_full: number
  precio_tracto_ida?: number
  precio_tracto_regreso?: number
  precio_sencillo_ida?: number
  precio_sencillo_regreso?: number
  precio_full_ida?: number
  precio_full_regreso?: number
  estatus: string
  fecha_vigencia?: string
  activo?: boolean
}

type Ruta = {
  id: string
  origen: string
  destino: string
  modalidad: string
  tipo_viaje?: string
  estatus: string
}

type RutaCaseta = {
  id: string
  ruta_id: string
  caseta_id: string
  orden: number
  cantidad: number
}

export default function CasetasPage() {
  const [casetas, setCasetas] = useState<Caseta[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [rutaCasetas, setRutaCasetas] = useState<RutaCaseta[]>([])
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const [nuevaCaseta, setNuevaCaseta] = useState({
    nombre: "",
    modalidad_precio: "TRACTO",
    tipo_precio: "IDA",
    precio: 0,
  })

  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    caseta_id: "",
    cantidad: 1,
  })

  const [verHistorico, setVerHistorico] = useState(false)
  const [casetaActualizando, setCasetaActualizando] = useState<string | null>(null)
  const [recalculoInfo, setRecalculoInfo] = useState<{ total: number; ok: number; fail: number }>({ total: 0, ok: 0, fail: 0 })
  const [recalculoErrores, setRecalculoErrores] = useState<string[]>([])

  const fetchAll = async () => {
    let query = supabase.from("casetas_catalogo").select("*")
    
    // Si no estamos viendo histórico, filtrar solo activas
    if (!verHistorico) {
      query = query.eq("activo", true)
    }
    
    const { data: casetasData } = await query
      .order("nombre")
      .order("fecha_vigencia", { ascending: false })
    
    const { data: rutasData } = await supabase.from("rutas_operativas").select("id, origen, destino, modalidad, tipo_viaje, estatus").order("origen")
    const { data: rutaCasetasData } = await supabase.from("ruta_casetas").select("*").order("orden")
    
    // Filtrar casetas para eliminar duplicados por ID (mantener solo la más reciente)
    const casetasUnicas = new Map()
    for (const c of (casetasData || [])) {
      if (!casetasUnicas.has(c.id)) {
        casetasUnicas.set(c.id, c)
      }
    }
    
    if (casetasData) setCasetas(Array.from(casetasUnicas.values()))
    if (rutasData) setRutas(rutasData)
    if (rutaCasetasData) setRutaCasetas(rutaCasetasData)
  }

  useEffect(() => { fetchAll() }, [verHistorico])

  const rutaActual = useMemo(() => {
    const ruta = rutas.find(r => r.id === rutaSeleccionada)
    if (!ruta) return undefined
    
    // Determinar tipo_viaje automáticamente basado en origen y destino
    // Si sale de una base (Coatzacoalcos o Puebla) → IDA
    // Si llega a una base (Coatzacoalcos o Puebla) → REGRESO
    const bases = ['Coatzacoalcos, Ver', 'Puebla, Pue']
    let tipoViaje = ruta.tipo_viaje || 'IDA'
    
    if (bases.includes(ruta.origen)) {
      tipoViaje = 'IDA'
    } else if (bases.includes(ruta.destino)) {
      tipoViaje = 'REGRESO'
    }
    
    return { ...ruta, tipo_viaje: tipoViaje }
  }, [rutas, rutaSeleccionada])

  useEffect(() => {
    if (rutaActual?.modalidad) {
      setNuevaCaseta((prev) => ({ ...prev, modalidad_precio: rutaActual.modalidad }))
    }
  }, [rutaActual])

  const casetasAsignadas = useMemo(() => {
    return rutaCasetas
      .filter(rc => rc.ruta_id === rutaSeleccionada)
      .sort((a, b) => a.orden - b.orden)
  }, [rutaCasetas, rutaSeleccionada])

  // Casetas activas para usar en cálculos y selecciones (siempre ignora el toggle de histórico)
  // Agrupa por nombre y toma solo la más reciente (fecha_vigencia más nueva)
  const casetasActivas = useMemo(() => {
    const activas = casetas.filter(c => c.activo === true)
    const mapa = new Map<string, Caseta>()
    
    // Ordenar por fecha_vigencia descendente (más reciente primero)
    const ordenadas = [...activas].sort((a, b) => {
      const fechaA = a.fecha_vigencia ? new Date(a.fecha_vigencia).getTime() : 0
      const fechaB = b.fecha_vigencia ? new Date(b.fecha_vigencia).getTime() : 0
      return fechaB - fechaA
    })
    
    // Tomar solo la más reciente de cada caseta por ID
    for (const caseta of ordenadas) {
      if (!mapa.has(caseta.id)) {
        mapa.set(caseta.id, caseta)
      }
    }
    
    return Array.from(mapa.values())
  }, [casetas])

  const getPrecio = (caseta: Caseta, modalidad: string, tipoViaje?: string) => {
    const tipo = tipoViaje || 'IDA'
    if (modalidad === "TRACTO") {
      return tipo === 'IDA' ? (caseta.precio_tracto_ida || caseta.precio_tracto || 0) : (caseta.precio_tracto_regreso || caseta.precio_tracto || 0)
    }
    if (modalidad === "SENCILLO") {
      return tipo === 'IDA' ? (caseta.precio_sencillo_ida || caseta.precio_sencillo || 0) : (caseta.precio_sencillo_regreso || caseta.precio_sencillo || 0)
    }
    return tipo === 'IDA' ? (caseta.precio_full_ida || caseta.precio_full || 0) : (caseta.precio_full_regreso || caseta.precio_full || 0)
  }

  const totalRuta = useMemo(() => {
    if (!rutaActual) return 0
    return casetasAsignadas.reduce((acc, rc) => {
      const caseta = casetasActivas.find(c => c.id === rc.caseta_id)
      if (!caseta) return acc
      const precio = getPrecio(caseta, rutaActual.modalidad, rutaActual.tipo_viaje)
      return acc + precio * rc.cantidad
    }, 0)
  }, [casetasAsignadas, casetasActivas, rutaActual])

  useEffect(() => {
    if (!rutaSeleccionada) return
    if (!Number.isFinite(totalRuta)) return

    const actualizarTotalCasetas = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) {
        console.warn("No hay sesión activa para actualizar total_casetas.")
        return
      }

      const { error } = await supabase
        .from("rutas_operativas")
        .update({ total_casetas: totalRuta })
        .eq("id", rutaSeleccionada)

      if (error) {
        console.error("Error al actualizar total de casetas:", error)
      }
    }

    actualizarTotalCasetas()
  }, [rutaSeleccionada, totalRuta])

  const handleAddCasetaCatalogo = async () => {
    if (!nuevaCaseta.nombre) return alert("El nombre de la caseta es obligatorio")
    setLoading(true)
    const precios = {
      precio_tracto_ida: 0,
      precio_tracto_regreso: 0,
      precio_sencillo_ida: 0,
      precio_sencillo_regreso: 0,
      precio_full_ida: 0,
      precio_full_regreso: 0,
    }
    
    // Determinar qué campo actualizar basado en modalidad y tipo
    const campoIda = `precio_${nuevaCaseta.modalidad_precio.toLowerCase()}_ida`
    const campoRegreso = `precio_${nuevaCaseta.modalidad_precio.toLowerCase()}_regreso`
    
    if (nuevaCaseta.tipo_precio === "IDA") {
      precios[campoIda as keyof typeof precios] = nuevaCaseta.precio || 0
    } else {
      precios[campoRegreso as keyof typeof precios] = nuevaCaseta.precio || 0
    }
    
    const { error } = await supabase.from("casetas_catalogo").insert([{
      nombre: nuevaCaseta.nombre,
      ...precios,
    }])
    if (!error) {
      setNuevaCaseta({ nombre: "", modalidad_precio: "TRACTO", tipo_precio: "IDA", precio: 0 })
      await fetchAll()
    } else alert(error.message)
    setLoading(false)
  }

  const handleActualizarPrecio = async (casetaActual: Caseta) => {
    setCasetaActualizando(casetaActual.id)
    setNuevaCaseta({
      nombre: casetaActual.nombre,
      modalidad_precio: "TRACTO",
      tipo_precio: "IDA",
      precio: 0,
    })
  }

  const handleGuardarNuevoPrecio = async () => {
    if (!casetaActualizando) return handleAddCasetaCatalogo()
    
    const casetaAnterior = casetas.find(c => c.id === casetaActualizando)
    if (!casetaAnterior) return

    setLoading(true)
    
    // Marcar la versión anterior como inactiva
    await supabase.from("casetas_catalogo").update({ activo: false }).eq("id", casetaActualizando)
    
    // Crear nueva versión con precios actualizados
    const preciosNuevos = {
      precio_tracto_ida: casetaAnterior.precio_tracto_ida || casetaAnterior.precio_tracto,
      precio_tracto_regreso: casetaAnterior.precio_tracto_regreso || casetaAnterior.precio_tracto,
      precio_sencillo_ida: casetaAnterior.precio_sencillo_ida || casetaAnterior.precio_sencillo,
      precio_sencillo_regreso: casetaAnterior.precio_sencillo_regreso || casetaAnterior.precio_sencillo,
      precio_full_ida: casetaAnterior.precio_full_ida || casetaAnterior.precio_full,
      precio_full_regreso: casetaAnterior.precio_full_regreso || casetaAnterior.precio_full,
    }
    
    // Actualizar el precio específico
    const campoIda = `precio_${nuevaCaseta.modalidad_precio.toLowerCase()}_ida`
    const campoRegreso = `precio_${nuevaCaseta.modalidad_precio.toLowerCase()}_regreso`
    
    if (nuevaCaseta.tipo_precio === "IDA") {
      preciosNuevos[campoIda as keyof typeof preciosNuevos] = nuevaCaseta.precio
    } else {
      preciosNuevos[campoRegreso as keyof typeof preciosNuevos] = nuevaCaseta.precio
    }
    
    const { error } = await supabase.from("casetas_catalogo").insert([{
      nombre: casetaAnterior.nombre,
      ...preciosNuevos,
      activo: true,
      fecha_vigencia: new Date().toISOString().split('T')[0],
    }])
    
    if (!error) {
      setNuevaCaseta({ nombre: "", modalidad_precio: "TRACTO", precio: 0 })
      setCasetaActualizando(null)
      await fetchAll()
    } else alert(error.message)
    
    setLoading(false)
  }

  const handleDeleteCasetaCatalogo = async (id: string, nombre: string, activo: boolean) => {
    let mensaje = `¿Eliminar la versión de "${nombre}"?`
    if (activo) {
      mensaje = `⚠️ Esta es la versión ACTIVA de "${nombre}". ¿Estás seguro de que deseas eliminarla? Las nuevas rutas no podrán usar esta caseta.`
    } else {
      mensaje = `¿Eliminar esta versión histórica de "${nombre}"?`
    }
    
    const confirmado = confirm(mensaje)
    if (!confirmado) return
    setLoading(true)
    const { error } = await supabase.from("casetas_catalogo").delete().eq("id", id)
    if (error) alert(error.message)
    else await fetchAll()
    setLoading(false)
  }

  const handleAddCasetaRuta = async () => {
    if (!rutaSeleccionada) return alert("Selecciona una ruta")
    if (!nuevaAsignacion.caseta_id) return alert("Selecciona una caseta")
    const nextOrder = (casetasAsignadas[casetasAsignadas.length - 1]?.orden || 0) + 1
    setLoading(true)
    const { error } = await supabase.from("ruta_casetas").insert([{
      ruta_id: rutaSeleccionada,
      caseta_id: nuevaAsignacion.caseta_id,
      cantidad: nuevaAsignacion.cantidad || 1,
      orden: nextOrder,
    }])
    if (!error) {
      setNuevaAsignacion({ caseta_id: "", cantidad: 1 })
      await fetchAll()
    } else alert(error.message)
    setLoading(false)
  }

  const handleUpdateCantidad = async (id: string, cantidad: number) => {
    setLoading(true)
    const { error } = await supabase.from("ruta_casetas").update({ cantidad }).eq("id", id)
    if (error) alert(error.message)
    await fetchAll()
    setLoading(false)
  }

  const handleDeleteRutaCaseta = async (id: string) => {
    const confirmado = confirm("¿Eliminar esta caseta de la ruta?")
    if (!confirmado) return
    setLoading(true)
    const { error } = await supabase.from("ruta_casetas").delete().eq("id", id)
    if (error) alert(error.message)
    await fetchAll()
    setLoading(false)
  }

  const resolveTipoViaje = (ruta: Ruta) => {
    const bases = ["Coatzacoalcos, Ver", "Puebla, Pue"]
    let tipoViaje = ruta.tipo_viaje || "IDA"
    if (bases.includes(ruta.origen)) {
      tipoViaje = "IDA"
    } else if (bases.includes(ruta.destino)) {
      tipoViaje = "REGRESO"
    }
    return tipoViaje
  }

  const recalcularTotalesCasetas = async () => {
    if (!rutas.length) return
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) {
        alert("Necesitas iniciar sesión para actualizar total_casetas.")
        return
      }

      const errores: string[] = []
      let ok = 0

      setRecalculoInfo({ total: rutas.length, ok: 0, fail: 0 })
      setRecalculoErrores([])

      for (const ruta of rutas) {
        const tipoViaje = resolveTipoViaje(ruta)
        const casetasRuta = rutaCasetas.filter((rc) => rc.ruta_id === ruta.id)
        const total = casetasRuta.reduce((acc, rc) => {
          const caseta = casetasActivas.find((c) => c.id === rc.caseta_id)
          if (!caseta) return acc
          const precio = getPrecio(caseta, ruta.modalidad, tipoViaje)
          return acc + precio * rc.cantidad
        }, 0)

        const { error } = await supabase
          .from("rutas_operativas")
          .update({ total_casetas: total })
          .eq("id", ruta.id)

        if (error) {
          errores.push(`${ruta.origen} → ${ruta.destino} (${ruta.modalidad}): ${error.message}`)
        } else {
          ok += 1
        }

        setRecalculoInfo({ total: rutas.length, ok, fail: errores.length })
      }

      if (errores.length) {
        console.error("Errores al recalcular total_casetas:", errores)
        setRecalculoErrores(errores)
        alert(`No se pudo actualizar ${errores.length} rutas. Revisa permisos/RLS.`)
      }

      await fetchAll()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">CASE<span style={{ color: AMEL_YELLOW }}>TAS</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catálogo */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Catálogo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Nombre de caseta" value={nuevaCaseta.nombre} onChange={(e) => setNuevaCaseta({ ...nuevaCaseta, nombre: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="w-full border rounded px-3 py-2 font-bold bg-white"
                  value={nuevaCaseta.modalidad_precio}
                  onChange={(e) => setNuevaCaseta({ ...nuevaCaseta, modalidad_precio: e.target.value })}
                >
                  {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  className="w-full border rounded px-3 py-2 font-bold bg-white"
                  value={nuevaCaseta.tipo_precio}
                  onChange={(e) => setNuevaCaseta({ ...nuevaCaseta, tipo_precio: e.target.value })}
                >
                  <option value="IDA">IDA</option>
                  <option value="REGRESO">REGRESO</option>
                </select>
                <Input type="number" step="0.01" placeholder="Precio" value={nuevaCaseta.precio} onChange={(e) => setNuevaCaseta({ ...nuevaCaseta, precio: parseFloat(e.target.value) || 0 })} />
              </div>
              <Button className="w-full font-black" onClick={handleGuardarNuevoPrecio} disabled={loading}>
                <PlusCircle className="h-4 w-4 mr-2" /> {casetaActualizando ? 'GUARDAR NUEVA VERSIÓN' : 'AGREGAR CASETA'}
              </Button>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setVerHistorico(!verHistorico)}>
                  <History className="h-4 w-4 mr-2" />
                  {verHistorico ? 'Solo Activas' : 'Ver Histórico'}
                </Button>
                {casetaActualizando && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setCasetaActualizando(null)
                    setNuevaCaseta({ nombre: "", modalidad_precio: "TRACTO", tipo_precio: "IDA", precio: 0 })
                  }}>
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {casetas
                  .filter(c => {
                    const modalidad = nuevaCaseta.modalidad_precio
                    const tipo = nuevaCaseta.tipo_precio
                    
                    if (modalidad === 'TRACTO') {
                      return tipo === 'IDA' ? (c.precio_tracto_ida || 0) > 0 : (c.precio_tracto_regreso || 0) > 0
                    }
                    if (modalidad === 'SENCILLO') {
                      return tipo === 'IDA' ? (c.precio_sencillo_ida || 0) > 0 : (c.precio_sencillo_regreso || 0) > 0
                    }
                    return tipo === 'IDA' ? (c.precio_full_ida || 0) > 0 : (c.precio_full_regreso || 0) > 0
                  })
                  .map(c => {
                    const getPrecioDisplay = () => {
                      const modalidad = nuevaCaseta.modalidad_precio
                      const tipo = nuevaCaseta.tipo_precio
                      
                      if (modalidad === 'TRACTO') {
                        return tipo === 'IDA' ? (c.precio_tracto_ida || 0) : (c.precio_tracto_regreso || 0)
                      }
                      if (modalidad === 'SENCILLO') {
                        return tipo === 'IDA' ? (c.precio_sencillo_ida || 0) : (c.precio_sencillo_regreso || 0)
                      }
                      return tipo === 'IDA' ? (c.precio_full_ida || 0) : (c.precio_full_regreso || 0)
                    }
                    
                    return (
                      <div key={c.id} className={`p-3 border rounded-lg flex items-center justify-between ${casetaActualizando === c.id ? 'bg-yellow-50 border-yellow-400' : 'bg-white'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{c.nombre}</p>
                            {!c.activo && <Badge variant="secondary" className="text-[9px]">Histórico</Badge>}
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            {nuevaCaseta.modalidad_precio} {nuevaCaseta.tipo_precio}: ${(getPrecioDisplay() || 0).toFixed(2)}
                          </p>
                          {c.fecha_vigencia && (
                            <p className="text-[9px] text-zinc-400">Vigente desde: {new Date(c.fecha_vigencia).toLocaleDateString('es-MX')}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {c.activo && (
                            <Button variant="ghost" size="sm" onClick={() => handleActualizarPrecio(c)} disabled={loading}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCasetaCatalogo(c.id, c.nombre, c.activo || false)} 
                            disabled={loading}
                            className={!c.activo ? "opacity-100" : "opacity-60 hover:opacity-100"}
                          >
                            <Trash2 className={`h-4 w-4 ${c.activo ? "text-orange-500" : "text-red-500"}`} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Asignación por ruta */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Casetas por Ruta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select className="w-full border rounded px-3 py-2 font-bold bg-white"
                        value={rutaSeleccionada}
                        onChange={(e) => setRutaSeleccionada(e.target.value)}>
                  <option value="">Selecciona una ruta</option>
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.origen} → {r.destino} ({r.modalidad})</option>
                  ))}
                </select>
                {rutaActual && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rutaActual.modalidad}</Badge>
                    <Badge variant={rutaActual.estatus === "Activo" ? "default" : "secondary"}>{rutaActual.estatus}</Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select className="w-full border rounded px-3 py-2 font-bold bg-white text-sm"
                        value={nuevaAsignacion.caseta_id}
                        onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, caseta_id: e.target.value })}>
                  <option value="">Selecciona caseta</option>
                  {casetasActivas.map(c => {
                    const precios = [
                      { label: 'TRACTO IDA', precio: c.precio_tracto_ida || 0 },
                      { label: 'TRACTO REGRESO', precio: c.precio_tracto_regreso || 0 },
                      { label: 'SENCILLO IDA', precio: c.precio_sencillo_ida || 0 },
                      { label: 'SENCILLO REGRESO', precio: c.precio_sencillo_regreso || 0 },
                      { label: 'FULL IDA', precio: c.precio_full_ida || 0 },
                      { label: 'FULL REGRESO', precio: c.precio_full_regreso || 0 }
                    ].filter(p => p.precio > 0)
                    
                    const preciosTexto = precios.length > 0 
                      ? precios.map(p => `${p.label} $${(p.precio || 0).toFixed(2)}`).join(' | ')
                      : 'Sin precios configurados'
                    
                    return (
                      <option key={c.id} value={c.id}>
                        {c.nombre} — {preciosTexto}
                      </option>
                    )
                  })}
                </select>
                <Input type="number" min={1} placeholder="Cantidad" value={nuevaAsignacion.cantidad}
                       onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, cantidad: parseInt(e.target.value) || 1 })} />
                <Button className="font-black" onClick={handleAddCasetaRuta} disabled={loading}>
                  <PlusCircle className="h-4 w-4 mr-2" /> AGREGAR
                </Button>
              </div>

              <div className="space-y-2">
                {casetasAsignadas.map(rc => {
                  const caseta = casetasActivas.find(c => c.id === rc.caseta_id)
                  if (!caseta || !rutaActual) return null
                  const precio = getPrecio(caseta, rutaActual.modalidad, rutaActual.tipo_viaje)
                  const subtotal = precio * rc.cantidad
                  return (
                    <div key={rc.id} className="p-3 bg-white border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{rc.orden}. {caseta.nombre}</p>
                        <p className="text-[10px] text-zinc-500">
                          {rutaActual.modalidad} {rutaActual.tipo_viaje || 'IDA'}: ${precio.toFixed(2)} · Subtotal: ${subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} className="w-20" value={rc.cantidad} onChange={(e) => handleUpdateCantidad(rc.id, parseInt(e.target.value) || 1)} />
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRutaCaseta(rc.id)} disabled={loading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-3 bg-zinc-100 rounded-lg border">
                <p className="text-xs uppercase font-bold text-zinc-600">Total Casetas (Ruta)</p>
                <p className="text-2xl font-black">${totalRuta.toFixed(2)}</p>
              </div>

              <Button
                variant="outline"
                className="w-full font-black"
                onClick={recalcularTotalesCasetas}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> RECALCULAR TOTALES (TODAS LAS RUTAS)
              </Button>
              <div className="text-xs text-zinc-600">
                Actualización: {recalculoInfo.ok}/{recalculoInfo.total} · Errores: {recalculoInfo.fail}
              </div>
              {recalculoErrores.length > 0 && (
                <div className="text-[11px] text-red-600 max-h-[120px] overflow-y-auto border rounded p-2 bg-red-50">
                  {recalculoErrores.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
