"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = "https://hgkzcdmagdtjgxaniswr.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"
const supabase = createClient(supabaseUrl, supabaseKey)

export default function LogisticaDashboardPage() {
  const [allViajes, setAllViajes] = useState<any[]>([])
  const [fechaInicio, setFechaInicio] = useState<string>("" )
  const [fechaFin, setFechaFin] = useState<string>("")
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string>("ALL")
  const [conexiones, setConexiones] = useState<any[]>([])
  const [unidadesCatalogo, setUnidadesCatalogo] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const toNumber = (value: any) => {
    if (value === "" || value === null || value === undefined) return 0
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const normalizeStatus = (status: any) => {
    const normalized = (status || "").toUpperCase()
    return normalized === "ENTREGADO" ? "FINALIZADO" : normalized
  }

  const isTracLike = (unidad: any) => {
    const tipo = String(unidad?.tipo || "").toUpperCase()
    const economico = String(unidad?.economico || "").toUpperCase()
    return tipo.includes("TRAC") || economico.includes("TRAC")
  }

  const normalizeEconomico = (value: any) => String(value || "").trim().toUpperCase()

  const formatKmCompact = (value: number) => {
    if (!Number.isFinite(value)) return "0"
    return value.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })
  }

  const roundUpToStep = (value: number, step: number) => {
    if (!Number.isFinite(value) || value <= 0) return step
    return Math.ceil(value / step) * step
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (Math.PI / 180) * angleDeg
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    }
  }

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  const getKmEcuacion = (viaje: any) => {
    if (!viaje) return 0
    let kmBruto = 0

    if (Number.isFinite(viaje.km_total)) {
      kmBruto = Number(viaje.km_total)
    } else if (viaje.km_final !== null && viaje.km_final !== undefined) {
      kmBruto = toNumber(viaje.km_final) - toNumber(viaje.km_inicial)
    } else {
      return 0
    }

    const kmEcu = viaje.es_millas ? (kmBruto * 1.6) : kmBruto
    return Number.isFinite(kmEcu) ? kmEcu : 0
  }

  const getDieselConsumido = (viaje: any) => {
    const diesel =
      (toNumber(viaje?.lts_cargado_pilot) - toNumber(viaje?.lts_final_pilot)) +
      (toNumber(viaje?.lts_cargado_copilot) - toNumber(viaje?.lts_final_copilot))
    return Number.isFinite(diesel) ? diesel : 0
  }

  const getRendimiento = (viaje: any) => {
    const km = getKmEcuacion(viaje)
    const diesel = Math.max(getDieselConsumido(viaje), 0)
    return diesel > 0 ? (km / diesel) : 0
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: v, error: viajesError } = await supabase.from("viajes").select("*").order("created_at", { ascending: false })
      const { data: unidadesAll, error: unidadesError } = await supabase.from("unidades").select("id, economico, tipo, estatus")
      const { data: con, error: conError } = await supabase.from("unidades_conexiones").select("*").eq("activo", true)

      if (viajesError) throw viajesError
      if (unidadesError) throw unidadesError

      if (v) setAllViajes(v)
      if (unidadesAll) setUnidadesCatalogo(unidadesAll)
      if (conError) {
        console.warn("No se pudieron cargar conexiones de unidades:", conError.message)
      } else if (con) {
        setConexiones(con)
      }
    } catch (error: any) {
      console.error("Error al cargar dashboard:", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!fechaInicio || !fechaFin) {
      const hoy = new Date()
      const inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - 29)
      setFechaInicio(inicio.toISOString().split("T")[0])
      setFechaFin(hoy.toISOString().split("T")[0])
    }
  }, [fechaInicio, fechaFin])

  const tracUnidades = useMemo(() => {
    return unidadesCatalogo
      .filter((u) => isTracLike(u))
      .map((u) => u.economico)
      .filter(Boolean)
      .sort()
  }, [unidadesCatalogo])

  const dashboardViajes = useMemo(() => {
    if (!fechaInicio || !fechaFin) return []
    const inicio = new Date(`${fechaInicio}T00:00:00`)
    const fin = new Date(`${fechaFin}T23:59:59`)

    return allViajes.filter((viaje) => {
      if (!viaje.fecha_inicial) return false
      const fecha = new Date(`${viaje.fecha_inicial}T00:00:00`)
      if (fecha < inicio || fecha > fin) return false
      if (unidadSeleccionada !== "ALL" && normalizeEconomico(viaje.economico) !== normalizeEconomico(unidadSeleccionada)) return false
      return true
    })
  }, [allViajes, fechaInicio, fechaFin, unidadSeleccionada])

  const unidadEstadoActual = useMemo(() => {
    if (unidadSeleccionada === "ALL") return "—"
    const viajesUnidad = allViajes
      .filter((v) => normalizeEconomico(v.economico) === normalizeEconomico(unidadSeleccionada))
      .sort((a, b) => String(b.created_at || b.fecha_inicial || "").localeCompare(String(a.created_at || a.fecha_inicial || "")))
    if (!viajesUnidad.length) return "SIN VIAJES"
    const status = normalizeStatus(viajesUnidad[0].estatus)
    return status || "SIN ESTATUS"
  }, [allViajes, unidadSeleccionada])

  const dashboardStats = useMemo(() => {
    const viajesCargados = dashboardViajes.filter((v) => (v.estado_carga || "").toUpperCase() === "CARGADO")
    const totalKm = dashboardViajes.reduce((sum, v) => sum + getKmEcuacion(v), 0)
    const totalDiesel = dashboardViajes.reduce((sum, v) => sum + Math.max(getDieselConsumido(v), 0), 0)
    const avgRendimiento = totalDiesel > 0 ? totalKm / totalDiesel : 0
    const finalizados = viajesCargados.filter((v) => normalizeStatus(v.estatus) === "FINALIZADO").length

    return {
      totalViajes: viajesCargados.length,
      totalKm,
      totalDiesel,
      avgRendimiento,
      finalizados,
    }
  }, [dashboardViajes])

  const viajesPorDia = useMemo(() => {
    const map = new Map<string, { fecha: string; viajes: number; km: number }>()
    for (const viaje of dashboardViajes) {
      if (!viaje.fecha_inicial) continue
      const key = viaje.fecha_inicial
      const entry = map.get(key) || { fecha: key, viajes: 0, km: 0 }
      entry.viajes += 1
      entry.km += getKmEcuacion(viaje)
      map.set(key, entry)
    }
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [dashboardViajes])

  const viajesTabla = useMemo(() => {
    return [...dashboardViajes].sort((a, b) => {
      const aKey = String(a.fecha_inicial || a.created_at || "")
      const bKey = String(b.fecha_inicial || b.created_at || "")
      return bKey.localeCompare(aKey)
    })
  }, [dashboardViajes])

  const rendimientoPorRuta = useMemo(() => {
    const build = (estadoCarga: string) => {
      const map = new Map<string, { ruta: string; totalKm: number; totalDiesel: number; count: number }>()
      for (const viaje of dashboardViajes) {
        if ((viaje.estado_carga || "").toUpperCase() !== estadoCarga) continue
        const ruta = `${(viaje.origen || "").toUpperCase()} → ${(viaje.destino || "").toUpperCase()} (${(viaje.modalidad || "").toUpperCase()})`
        const entry = map.get(ruta) || { ruta, totalKm: 0, totalDiesel: 0, count: 0 }
        entry.totalKm += getKmEcuacion(viaje)
        entry.totalDiesel += Math.max(getDieselConsumido(viaje), 0)
        entry.count += 1
        map.set(ruta, entry)
      }

      return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((entry) => {
          const rendimiento = entry.totalDiesel > 0 ? (entry.totalKm / entry.totalDiesel) : 0
          return { ruta: entry.ruta, rendimiento: Number(rendimiento.toFixed(2)) }
        })
    }

    return {
      cargado: build("CARGADO"),
      vacio: build("VACIO"),
    }
  }, [dashboardViajes])

  const rendimientoVacioSerie = useMemo(() => {
    const viajesVacio = dashboardViajes.filter((v) => (v.estado_carga || "").toUpperCase() === "VACIO")
    const rutaCounts = new Map<string, number>()
    for (const viaje of viajesVacio) {
      const ruta = `${(viaje.origen || "").toUpperCase()} → ${(viaje.destino || "").toUpperCase()}`
      rutaCounts.set(ruta, (rutaCounts.get(ruta) || 0) + 1)
    }

    const rutasTop = Array.from(rutaCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ruta]) => ruta)

    const map = new Map<string, Record<string, any>>()
    for (const viaje of viajesVacio) {
      const fecha = viaje.fecha_inicial
      if (!fecha) continue
      const ruta = `${(viaje.origen || "").toUpperCase()} → ${(viaje.destino || "").toUpperCase()}`
      if (!rutasTop.includes(ruta)) continue

      const rendimiento = getRendimiento(viaje)
      const entry = map.get(fecha) || { fecha }
      if (!entry[`${ruta}_sum`]) {
        entry[`${ruta}_sum`] = 0
        entry[`${ruta}_count`] = 0
      }
      entry[`${ruta}_sum`] += rendimiento
      entry[`${ruta}_count`] += 1
      map.set(fecha, entry)
    }

    const data = Array.from(map.values())
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .map((entry) => {
        const result: Record<string, any> = { fecha: entry.fecha }
        for (const ruta of rutasTop) {
          const sum = entry[`${ruta}_sum`] || 0
          const count = entry[`${ruta}_count`] || 0
          result[ruta] = count > 0 ? Number((sum / count).toFixed(2)) : null
        }
        return result
      })

    return { data, rutasTop }
  }, [dashboardViajes])

  const rendimientoCargadoSerie = useMemo(() => {
    const viajesCargado = dashboardViajes.filter((v) => (v.estado_carga || "").toUpperCase() === "CARGADO")
    const rutaCounts = new Map<string, number>()
    for (const viaje of viajesCargado) {
      const ruta = `${(viaje.origen || "").toUpperCase()} → ${(viaje.destino || "").toUpperCase()}`
      rutaCounts.set(ruta, (rutaCounts.get(ruta) || 0) + 1)
    }

    const rutasTop = Array.from(rutaCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ruta]) => ruta)

    const map = new Map<string, Record<string, any>>()
    for (const viaje of viajesCargado) {
      const fecha = viaje.fecha_inicial
      if (!fecha) continue
      const ruta = `${(viaje.origen || "").toUpperCase()} → ${(viaje.destino || "").toUpperCase()}`
      if (!rutasTop.includes(ruta)) continue

      const rendimiento = getRendimiento(viaje)
      const entry = map.get(fecha) || { fecha }
      if (!entry[`${ruta}_sum`]) {
        entry[`${ruta}_sum`] = 0
        entry[`${ruta}_count`] = 0
      }
      entry[`${ruta}_sum`] += rendimiento
      entry[`${ruta}_count`] += 1
      map.set(fecha, entry)
    }

    const data = Array.from(map.values())
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .map((entry) => {
        const result: Record<string, any> = { fecha: entry.fecha }
        for (const ruta of rutasTop) {
          const sum = entry[`${ruta}_sum`] || 0
          const count = entry[`${ruta}_count`] || 0
          result[ruta] = count > 0 ? Number((sum / count).toFixed(2)) : null
        }
        return result
      })

    return { data, rutasTop }
  }, [dashboardViajes])

      const kmHistorico = useMemo(() => {
        return allViajes.reduce((sum, viaje) => {
          if (unidadSeleccionada !== "ALL" && normalizeEconomico(viaje.economico) !== normalizeEconomico(unidadSeleccionada)) return sum
          return sum + getKmEcuacion(viaje)
        }, 0)
      }, [allViajes, unidadSeleccionada])

      const kmHistoricoMax = useMemo(() => {
        return roundUpToStep(Math.max(kmHistorico, 0), 10000)
      }, [kmHistorico])

  const conexionesActuales = useMemo(() => {
    const unidadesById = new Map(unidadesCatalogo.map((u) => [u.id, u]))
    const tractos = unidadesCatalogo.filter((u) => isTracLike(u) && u.estatus === "Activo")
    const conexionesMap = new Map<string, { tracto: any; PORT?: any; PLAT?: any; DOL?: any }>()

    for (const tracto of tractos) {
      conexionesMap.set(tracto.id, { tracto })
    }

    for (const conexion of conexiones) {
      const tracto = unidadesById.get(conexion.tracto_id)
      const equipo = unidadesById.get(conexion.equipo_id)
      if (!tracto || !equipo) continue
      const tipo = (conexion.tipo_equipo || equipo.tipo || "").toUpperCase()
      const entry = conexionesMap.get(tracto.id) || { tracto }
      if (tipo === "PORT") entry.PORT = equipo
      if (tipo === "PLAT") entry.PLAT = equipo
      if (tipo === "DOL") entry.DOL = equipo
      conexionesMap.set(tracto.id, entry)
    }

    return Array.from(conexionesMap.values()).sort((a, b) => String(a.tracto.economico).localeCompare(String(b.tracto.economico)))
  }, [conexiones, unidadesCatalogo])

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900">
      <div className="max-w-[1800px] mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4 border-yellow-400">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">AMEL <span className="text-zinc-400">LOGÍSTICA</span></h1>
            <p className="text-xs text-zinc-500">Dashboard de rendimiento y operaciones</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/trips" className="w-full sm:w-auto">
              <Button variant="outline" className="font-black italic px-6 h-10 shadow-sm w-full">VOLVER A LOGÍSTICA</Button>
            </Link>
            <Button onClick={fetchData} style={{ backgroundColor: AMEL_YELLOW, color: "#000" }} className="font-black italic px-6 h-10 shadow-md">
              {loading ? "ACTUALIZANDO..." : "ACTUALIZAR"}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-2xl overflow-hidden p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Dashboard Logística</h2>
              <p className="text-xs text-zinc-500">Resumen por rango y unidad</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Inicio:</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Fin:</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Unidad:</label>
                <select value={unidadSeleccionada} onChange={(e) => setUnidadSeleccionada(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm">
                  <option value="ALL">Todas</option>
                  {tracUnidades.map((eco) => (
                    <option key={eco} value={eco}>{eco}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50">
              <div className="text-[10px] font-black uppercase text-zinc-500">Viajes</div>
              <div className="text-2xl font-black text-zinc-900">{dashboardStats.totalViajes}</div>
              <div className="text-[11px] text-zinc-500">Finalizados: {dashboardStats.finalizados}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 bg-emerald-50/40">
              <div className="text-[10px] font-black uppercase text-emerald-700">Rendimiento promedio</div>
              <div className="text-2xl font-black text-emerald-800">{dashboardStats.avgRendimiento.toFixed(2)} km/l</div>
              <div className="text-[11px] text-emerald-700">Diesel total: {dashboardStats.totalDiesel.toLocaleString(undefined, { maximumFractionDigits: 0 })} L</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 bg-blue-50/40">
              <div className="text-[10px] font-black uppercase text-blue-700">Km acumulados</div>
              <div className="text-2xl font-black text-blue-800">{dashboardStats.totalKm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-[11px] text-blue-700">Unidad: {unidadSeleccionada === "ALL" ? "Todas" : unidadSeleccionada}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 bg-amber-50/40">
              <div className="text-[10px] font-black uppercase text-amber-700">Estado actual</div>
              <div className={`text-2xl font-black ${unidadEstadoActual === "EN RUTA" ? "text-amber-800" : "text-emerald-800"}`}>
                {unidadEstadoActual}
              </div>
              <div className="text-[11px] text-amber-700">Diesel: {dashboardStats.totalDiesel.toLocaleString(undefined, { maximumFractionDigits: 0 })} L</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Rendimiento por ruta (CARGADO)</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rendimientoCargadoSerie.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 9 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} km/l`, name]}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend
                      formatter={(value: any) => {
                        const index = rendimientoCargadoSerie.rutasTop.indexOf(String(value))
                        return index >= 0 ? `Ruta ${index + 1}` : String(value)
                      }}
                    />
                    {rendimientoCargadoSerie.rutasTop.map((ruta, index) => {
                      const color = ["#10b981", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444", "#64748b"][index % 6]
                      return (
                        <Line
                          key={ruta}
                          type="monotone"
                          dataKey={ruta}
                          strokeWidth={2}
                          connectNulls={false}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: color, stroke: color, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: color, stroke: color, strokeWidth: 0 }}
                          stroke={color}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">Pasa el cursor para ver el origen-destino completo.</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Rendimiento por ruta (VACÍO)</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rendimientoVacioSerie.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 9 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} km/l`, name]}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend
                      formatter={(value: any) => {
                        const index = rendimientoVacioSerie.rutasTop.indexOf(String(value))
                        return index >= 0 ? `Ruta ${index + 1}` : String(value)
                      }}
                    />
                    {rendimientoVacioSerie.rutasTop.map((ruta, index) => (
                      (() => {
                        const color = ["#f59e0b", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444", "#64748b"][index % 6]
                        return (
                      <Line
                        key={ruta}
                        type="monotone"
                        dataKey={ruta}
                        strokeWidth={2}
                        connectNulls={false}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: color, stroke: color, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: color, stroke: color, strokeWidth: 0 }}
                        stroke={color}
                      />
                        )
                      })()
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">Pasa el cursor para ver el origen-destino completo.</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Viajes por día</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viajesPorDia} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="viajes" stroke="#111827" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Km acumulados historico</div>
              <div className="text-[10px] text-zinc-400 mb-2">Indicador (no aplica rango)</div>
              <div className="h-[200px] flex items-center justify-center">
                <svg viewBox="0 0 220 140" className="w-full h-full">
                  <path d={describeArc(110, 120, 80, -180, 0)} stroke="#e5e7eb" strokeWidth="16" fill="none" />
                  <path
                    d={describeArc(
                      110,
                      120,
                      80,
                      -180,
                      -180 + Math.min(1, Math.max(0, kmHistoricoMax > 0 ? kmHistorico / kmHistoricoMax : 0)) * 180
                    )}
                    stroke="#0ea5e9"
                    strokeWidth="16"
                    fill="none"
                  />
                  <line
                    x1="110"
                    y1="120"
                    x2={110 + 70 * Math.cos((Math.PI / 180) * (-180 + Math.min(1, Math.max(0, kmHistoricoMax > 0 ? kmHistorico / kmHistoricoMax : 0)) * 180))}
                    y2={120 + 70 * Math.sin((Math.PI / 180) * (-180 + Math.min(1, Math.max(0, kmHistoricoMax > 0 ? kmHistorico / kmHistoricoMax : 0)) * 180))}
                    stroke="#111827"
                    strokeWidth="3"
                  />
                  <circle cx="110" cy="120" r="4" fill="#111827" />
                  <text x="110" y="110" textAnchor="middle" className="fill-zinc-700 text-base font-black">
                    {formatKmCompact(kmHistorico)}
                  </text>
                  <text x="30" y="135" textAnchor="start" className="fill-zinc-400 text-[10px]">0</text>
                  <text x="190" y="135" textAnchor="end" className="fill-zinc-400 text-[10px]">{formatKmCompact(kmHistoricoMax)}</text>
                </svg>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Conexiones actuales</div>
              <div className="max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px] font-black uppercase text-zinc-500">
                      <TableHead>Tracto</TableHead>
                      <TableHead>Porta</TableHead>
                      <TableHead>Dolly</TableHead>
                      <TableHead>Plataforma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conexionesActuales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-zinc-500">Sin conexiones registradas</TableCell>
                      </TableRow>
                    )}
                    {conexionesActuales.map((item) => (
                      <TableRow key={item.tracto.id} className="text-xs">
                        <TableCell className="font-bold">{item.tracto.economico}</TableCell>
                        <TableCell>{item.PORT?.economico || "—"}</TableCell>
                        <TableCell>{item.DOL?.economico || "—"}</TableCell>
                        <TableCell>{item.PLAT?.economico || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-[11px] font-black uppercase text-zinc-500 mb-2">Rendimiento por viaje</div>
            <div className="max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px] font-black uppercase text-zinc-500">
                    <TableHead>Origen - Destino</TableHead>
                    <TableHead>Fecha carga</TableHead>
                    <TableHead>Fecha descarga</TableHead>
                    <TableHead>Estatus carga</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Rendimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viajesTabla.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-zinc-500">Sin viajes en el periodo</TableCell>
                    </TableRow>
                  )}
                  {viajesTabla.map((viaje) => (
                    <TableRow key={viaje.id || `${viaje.economico}-${viaje.fecha_inicial}-${viaje.origen}-${viaje.destino}`} className="text-xs">
                      <TableCell className="font-bold">
                        {(viaje.origen || "").toUpperCase()} → {(viaje.destino || "").toUpperCase()}
                      </TableCell>
                      <TableCell>{viaje.fecha_inicial || "—"}</TableCell>
                      <TableCell>{viaje.fecha_final || "—"}</TableCell>
                      <TableCell>{(viaje.estado_carga || "—").toUpperCase()}</TableCell>
                      <TableCell>{viaje.economico || "—"}</TableCell>
                      <TableCell className="text-right">
                        {getRendimiento(viaje).toFixed(2)} km/l
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
