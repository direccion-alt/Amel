"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calculator, ArrowRightLeft, AlertTriangle, TrendingUp, TrendingDown, Download } from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8' 
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AnalisisFinanciero() {
  const [viajes, setViajes] = useState<any[]>([])
  const [rutasOperativas, setRutasOperativas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de filtros
  const [pagos, setPagos] = useState<any[]>([])
  
  const [filtros, setFiltros] = useState({
    economico: '',
    cliente: '',
    modalidad: '',
    estado_carga: '',
    origen: '',
    destino: '',
    minUtilidad: '',
    maxUtilidad: '',
    pagoClie: '',
    pagoOper: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: v, error: errV } = await supabase.from('viajes').select('*').order('created_at', { ascending: false })
    const { data: ro, error: errRo } = await supabase.from('rutas_operativas').select('*')
    const { data: p, error: errP } = await supabase.from('pagos').select('*')
    
    if (errV) console.error('Error fetching viajes:', errV)
    if (errRo) console.error('Error fetching rutas_operativas:', errRo)
    if (errP) console.error('Error fetching pagos:', errP)
    
    if (v) setViajes(v)
    if (ro) setRutasOperativas(ro)
    if (p) setPagos(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Suscripciones en tiempo real a cambios en las tablas
  useEffect(() => {
    // Suscripción a rutas_operativas
    const channelRutas = supabase
      .channel("rutas-operativas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rutas_operativas" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Suscripción a viajes
    const channelViajes = supabase
      .channel("viajes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "viajes" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Suscripción a ruta_casetas (asignaciones de casetas a rutas)
    const channelRutaCasetas = supabase
      .channel("ruta-casetas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ruta_casetas" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Suscripción a casetas_catalogo (precios de casetas)
    const channelCasetas = supabase
      .channel("casetas-catalogo-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "casetas_catalogo" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Suscripción a pagos (registro de pagos)
    const channelPagos = supabase
      .channel("pagos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagos" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRutas)
      supabase.removeChannel(channelViajes)
      supabase.removeChannel(channelRutaCasetas)
      supabase.removeChannel(channelCasetas)
      supabase.removeChannel(channelPagos)
    }
  }, [fetchData])

  // Función para combinar datos de viajes con rutas operativas
  const getDatosFinancieros = () => {
    return viajes.map((viaje, idx) => {
      // Normalizar valores para comparación - más agresivo
      const normalizar = (str: any) => {
        if (!str) return ''
        return String(str)
          .trim()
          .replace(/\s+/g, ' ')  // Reemplazar múltiples espacios por uno solo
          .toUpperCase()
      }

      const origenViaje = normalizar(viaje.origen)
      const destinoViaje = normalizar(viaje.destino)
      const modalidadViaje = normalizar(viaje.modalidad)
      const estadoCargaViaje = normalizar(viaje.estado_carga)

      // Buscar ruta operativa que coincida
      const rutaMatch = rutasOperativas.find(ruta => {
        const origenRuta = normalizar(ruta.origen)
        const destinoRuta = normalizar(ruta.destino)
        const modalidadRuta = normalizar(ruta.modalidad)
        const estadoCargaRuta = normalizar(ruta.estado_carga)

        const matchOrigen = origenRuta === origenViaje
        const matchDestino = destinoRuta === destinoViaje
        const matchModalidad = modalidadRuta === modalidadViaje
        const matchEstado = estadoCargaRuta === estadoCargaViaje
        const match = matchOrigen && matchDestino && matchModalidad && matchEstado


        return match
      })

      return {
        ...viaje,
        tarifa_cliente: rutaMatch?.costo_ruta || 0,
        pago_operador: rutaMatch?.pago_operador || 0,
        total_casetas: rutaMatch?.total_casetas || 0,
        tiene_ruta_operativa: !!rutaMatch
      }
    })
  }

  const datosFinancieros = getDatosFinancieros()
  
  // Función para obtener estado de pago
  const obtenerEstadoPago = (viaje_id: string, tipo: 'cliente' | 'operador') => {
    const pago = pagos.find(p => p.viaje_id === viaje_id && p.tipo === tipo)
    if (!pago) return 'pendiente'
    return pago.estado || 'pendiente'
  }

  const actualizarEstadoPago = async (
    viajeId: string,
    tipo: 'cliente' | 'operador',
    estado: 'pendiente' | 'completado',
    montoSugerido: number
  ) => {
    try {
      const pagoExistente = pagos.find(p => p.viaje_id === viajeId && p.tipo === tipo)

      if (pagoExistente?.id) {
        const { error } = await supabase
          .from('pagos')
          .update({ estado })
          .eq('id', pagoExistente.id)

        if (error) console.error('Error actualizando pago:', error)
      } else {
        const { error } = await supabase
          .from('pagos')
          .insert({
            viaje_id: viajeId,
            tipo,
            monto: montoSugerido || 0,
            estado,
            fecha_pago: new Date().toISOString()
          })

        if (error) console.error('Error creando pago:', error)
      }

      fetchData()
    } catch (err) {
      console.error('Error en actualizarEstadoPago:', err)
    }
  }
  
  // Calcular totales de pagos
  const pagosCliente = pagos.filter(p => p.tipo === 'cliente')
  const pagosOperador = pagos.filter(p => p.tipo === 'operador')
  
  const totalIngresosPendienteCliente = pagosCliente.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalIngresosPagadoCliente = pagosCliente.filter(p => p.estado === 'completado').reduce((sum, p) => sum + (p.monto || 0), 0)
  
  const totalPagoPendienteOperador = pagosOperador.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalPagoPagadoOperador = pagosOperador.filter(p => p.estado === 'completado').reduce((sum, p) => sum + (p.monto || 0), 0)
  
  // Función para filtrar datos
  const datosFiltrados = datosFinancieros.filter(v => {
    const peso = v.peso_ternium || 0
    const ingresoTotal = (v.tarifa_cliente || 0) * peso
    const iva = ingresoTotal * 0.16
    const retencion = ingresoTotal * 0.04
    const ingresoNeto = ingresoTotal + iva - retencion
    const gastosTotales = (v.pension || 0) + (v.gastos_adicionales || 0)
    const utilidad = ingresoNeto - (v.pago_operador || 0) - (v.total_casetas || 0) - (v.monto_diesel || 0) - gastosTotales
    const estadoPagoCliente = obtenerEstadoPago(v.id, 'cliente')
    const estadoPagoOperador = obtenerEstadoPago(v.id, 'operador')
    
    if (filtros.economico && !v.economico?.toLowerCase().includes(filtros.economico.toLowerCase())) return false
    if (filtros.cliente && !v.cliente?.toLowerCase().includes(filtros.cliente.toLowerCase())) return false
    if (filtros.modalidad && v.modalidad !== filtros.modalidad) return false
    if (filtros.estado_carga && v.estado_carga !== filtros.estado_carga) return false
    if (filtros.origen && !v.origen?.toLowerCase().includes(filtros.origen.toLowerCase())) return false
    if (filtros.destino && !v.destino?.toLowerCase().includes(filtros.destino.toLowerCase())) return false
    if (filtros.minUtilidad && utilidad < parseFloat(filtros.minUtilidad)) return false
    if (filtros.maxUtilidad && utilidad > parseFloat(filtros.maxUtilidad)) return false
    if (filtros.pagoClie && estadoPagoCliente !== filtros.pagoClie) return false
    if (filtros.pagoOper && estadoPagoOperador !== filtros.pagoOper) return false
    
    return true
  })
  
  // Calcular totales y estadísticas (multiplicando por peso)
  const totalIngresos = datosFinancieros.reduce((sum, v) => sum + ((v.tarifa_cliente || 0) * (v.peso_ternium || 0)), 0)
  const totalPagoOperadores = datosFinancieros.reduce((sum, v) => sum + (v.pago_operador || 0), 0)
  const totalCasetas = datosFinancieros.reduce((sum, v) => sum + (v.total_casetas || 0), 0)
  const totalDiesel = datosFinancieros.reduce((sum, v) => sum + (v.monto_diesel || 0), 0)
  const utilidadTotal = totalIngresos - totalPagoOperadores - totalCasetas - totalDiesel
  const viajesSinRuta = datosFinancieros.filter(v => !v.tiene_ruta_operativa).length

  const formatCompact = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
    return `$${value.toLocaleString()}`
  }

  const descargarXLSX = () => {
    const datos = datosFiltrados.map(v => {
      const peso = v.peso_ternium || 0
      const ingresoTotal = (v.tarifa_cliente || 0) * peso
      const iva = ingresoTotal * 0.16
      const retencion = ingresoTotal * 0.04
      const ingresoNeto = ingresoTotal + iva - retencion
      const gastosTotales = (v.pension || 0) + (v.gastos_adicionales || 0)
      const utilidad = ingresoNeto - (v.pago_operador || 0) - (v.total_casetas || 0) - (v.monto_diesel || 0) - gastosTotales
      const estadoPagoCliente = obtenerEstadoPago(v.id, 'cliente')
      const estadoPagoOperador = obtenerEstadoPago(v.id, 'operador')

      return {
        'UNIDAD': v.economico,
        'VIAJE': v.numero_viaje,
        'CLIENTE': v.cliente,
        'MODALIDAD': v.modalidad,
        'ESTADO CARGA': v.estado_carga,
        'ORIGEN': v.origen,
        'DESTINO': v.destino,
        'PESO (TON)': peso ? Number(peso).toFixed(3) : '---',
        'SALIDA': v.fecha_inicial,
        'LLEGADA': v.fecha_final || '---',
        'TICKET (LTS)': v.lts_ticket || '---',
        'DIESEL ($)': v.monto_diesel || 0,
        'PENSIÓN ($)': v.pension || 0,
        'GASTOS ADICIONALES ($)': v.gastos_adicionales || 0,
        'TARIFA CLIENTE': v.tarifa_cliente || 0,
        'INGRESO BRUTO': ingresoTotal.toFixed(2),
        'IVA (16%)': (ingresoTotal * 0.16).toFixed(2),
        'RETENCIÓN (4%)': (ingresoTotal * 0.04).toFixed(2),
        'INGRESO NETO': ingresoNeto.toFixed(2),
        'PAGO OPERADOR MONTO': v.pago_operador || 0,
        'TOTAL CASETAS': v.total_casetas || 0,
        'UTILIDAD': utilidad.toFixed(2),
        'ESTADO PAGO CLIENTE': estadoPagoCliente === 'completado' ? 'Pagado' : 'Pendiente',
        'ESTADO PAGO OPERADOR': estadoPagoOperador === 'completado' ? 'Pagado' : 'Pendiente'
      }
    })

    if (datos.length === 0) {
      alert('No hay datos para descargar')
      return
    }

    // Convertir datos a CSV
    const headers = Object.keys(datos[0])
    const csvContent = [
      headers.join(','),
      ...datos.map(row => headers.map(header => {
        let val = row[header as keyof typeof row]
        val = String(val).replace(/"/g, '""')
        return val.includes(',') ? `"${val}"` : val
      }).join(','))
    ].join('\n')

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const fecha = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `Analisis_Financiero_${fecha}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-2 md:p-4 text-zinc-900 w-full font-sans">
      <div className="max-w-[1800px] mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4" style={{borderColor: AMEL_YELLOW}}>
          <div className="flex items-center gap-4">
            <Calculator className="text-amber-600" size={32} />
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">
              ANÁLISIS <span className="text-zinc-400">FINANCIERO</span>
            </h1>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Ingresos</div>
            <div title={`$${totalIngresos.toLocaleString()}`} className="text-[clamp(13px,2vw,20px)] font-black text-blue-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalIngresos)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Pago Operadores</div>
            <div title={`$${totalPagoOperadores.toLocaleString()}`} className="text-[clamp(13px,2vw,20px)] font-black text-green-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalPagoOperadores)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Casetas</div>
            <div title={`$${totalCasetas.toLocaleString()}`} className="text-[clamp(13px,2vw,20px)] font-black text-amber-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalCasetas)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Diesel</div>
            <div title={`$${totalDiesel.toLocaleString()}`} className="text-[clamp(13px,2vw,20px)] font-black text-red-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalDiesel)}</div>
          </Card>
          
          <Card className={`p-4 bg-gradient-to-br ${utilidadTotal >= 0 ? 'from-purple-50 to-purple-100 border-purple-200' : 'from-red-50 to-red-100 border-red-200'} border-2 min-w-0 overflow-hidden`}>
            <div className={`text-[10px] font-bold ${utilidadTotal >= 0 ? 'text-purple-600' : 'text-red-600'} uppercase mb-1 flex items-center gap-1`}>
              Utilidad {utilidadTotal >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            </div>
            <div title={`$${utilidadTotal.toLocaleString()}`} className={`text-[clamp(13px,2vw,20px)] font-black ${utilidadTotal >= 0 ? 'text-purple-700' : 'text-red-700'} leading-none tracking-tight tabular-nums truncate`}>
              {formatCompact(utilidadTotal)}
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 border-2 border-zinc-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Total Viajes</div>
            <div title={datosFinancieros.length.toLocaleString()} className="text-[clamp(13px,2vw,20px)] font-black text-zinc-700 leading-none tracking-tight tabular-nums truncate">{datosFinancieros.length}</div>
          </Card>
        </div>

        {/* TARJETAS DE PAGOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Ingresos Pendiente</div>
            <div title={`$${totalIngresosPendienteCliente.toLocaleString()}`} className="text-[clamp(12px,1.9vw,18px)] font-black text-blue-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalIngresosPendienteCliente)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Ingresos Pagado</div>
            <div title={`$${totalIngresosPagadoCliente.toLocaleString()}`} className="text-[clamp(12px,1.9vw,18px)] font-black text-green-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalIngresosPagadoCliente)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Pago Operadores Pendiente</div>
            <div title={`$${totalPagoPendienteOperador.toLocaleString()}`} className="text-[clamp(12px,1.9vw,18px)] font-black text-red-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalPagoPendienteOperador)}</div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">Pago Operadores Pagado</div>
            <div title={`$${totalPagoPagadoOperador.toLocaleString()}`} className="text-[clamp(12px,1.9vw,18px)] font-black text-orange-700 leading-none tracking-tight tabular-nums truncate">{formatCompact(totalPagoPagadoOperador)}</div>
          </Card>
        </div>

        {/* ALERTA DE VIAJES SIN RUTA */}
        {viajesSinRuta > 0 && (
          <Card className="p-4 bg-red-50 border-2 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <span className="text-sm font-bold">
                {viajesSinRuta} viaje(s) sin ruta operativa configurada - Los datos financieros pueden estar incompletos
              </span>
            </div>
          </Card>
        )}

        {/* TABLA DE ANÁLISIS FINANCIERO */}
        <Card className="bg-white rounded-xl shadow-lg border-2 border-amber-200">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="text-amber-600" size={24} />
              <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900">
                Detalle por Viaje
              </h2>
            </div>
            <button
              onClick={descargarXLSX}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition"
            >
              <Download size={18} />
              Descargar CSV
            </button>
          </div>

          {/* FILTROS */}
          <div className="p-4 bg-zinc-50 border-b-2 border-zinc-200">
            <h3 className="text-sm font-black text-zinc-700 mb-3">🔍 FILTROS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2">
              <Input
                placeholder="Unidad..."
                value={filtros.economico}
                onChange={(e) => setFiltros({...filtros, economico: e.target.value})}
                className="text-xs h-8"
              />
              <Input
                placeholder="Cliente..."
                value={filtros.cliente}
                onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
                className="text-xs h-8"
              />
              <select
                value={filtros.modalidad}
                onChange={(e) => setFiltros({...filtros, modalidad: e.target.value})}
                className="text-xs h-8 px-2 border rounded bg-white"
              >
                <option value="">Modalidad...</option>
                <option value="FULL">FULL</option>
                <option value="SENCILLO">SENCILLO</option>
                <option value="TRACTO">TRACTO</option>
              </select>
              <select
                value={filtros.estado_carga}
                onChange={(e) => setFiltros({...filtros, estado_carga: e.target.value})}
                className="text-xs h-8 px-2 border rounded bg-white"
              >
                <option value="">Estado...</option>
                <option value="CARGADO">CARGADO</option>
                <option value="VACIO">VACIO</option>
              </select>
              <Input
                placeholder="Origen..."
                value={filtros.origen}
                onChange={(e) => setFiltros({...filtros, origen: e.target.value})}
                className="text-xs h-8"
              />
              <Input
                placeholder="Destino..."
                value={filtros.destino}
                onChange={(e) => setFiltros({...filtros, destino: e.target.value})}
                className="text-xs h-8"
              />
              <Input
                type="number"
                placeholder="Min Util..."
                value={filtros.minUtilidad}
                onChange={(e) => setFiltros({...filtros, minUtilidad: e.target.value})}
                className="text-xs h-8"
              />
              <Input
                type="number"
                placeholder="Max Util..."
                value={filtros.maxUtilidad}
                onChange={(e) => setFiltros({...filtros, maxUtilidad: e.target.value})}
                className="text-xs h-8"
              />
              <select
                value={filtros.pagoClie}
                onChange={(e) => setFiltros({...filtros, pagoClie: e.target.value})}
                className="text-xs h-8 px-2 border rounded bg-white"
              >
                <option value="">Pago Cliente...</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="completado">✓ Pagado</option>
              </select>
              <select
                value={filtros.pagoOper}
                onChange={(e) => setFiltros({...filtros, pagoOper: e.target.value})}
                className="text-xs h-8 px-2 border rounded bg-white"
              >
                <option value="">Pago Operador...</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="completado">✓ Pagado</option>
              </select>
            </div>
            <div className="mt-2 text-xs text-zinc-600">
              Mostrando {datosFiltrados.length} de {datosFinancieros.length} viajes
            </div>
          </div>
          
          {/* TABLA */}
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Cargando datos...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 border-b-2 border-zinc-300">
                    <TableHead className="text-center font-black text-[10px] border-r">UNIDAD</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">VIAJE</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">CLIENTE</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">MODALIDAD</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">ESTADO CARGA</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">RUTA</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-purple-50 border-r">PESO</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">SALIDA</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">LLEGADA</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">TICKET (LTS)</TableHead>
                    <TableHead className="text-center font-black text-[10px] border-r">MONTO $</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-orange-50 border-r">PENSIÓN $</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-rose-50 border-r">GASTOS ADI. $</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-blue-50 border-r">TARIFA CLIENTE</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-cyan-50 border-r">INGRESO BRUTO</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-orange-50 border-r">IVA (16%)</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-red-50 border-r">RETENCIÓN (4%)</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-emerald-50 border-r">INGRESO NETO</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-green-50 border-r">PAGO OPERADOR</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-amber-50 border-r">TOTAL CASETAS</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-purple-50 border-r">UTILIDAD</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-sky-50 border-r">PAGO CLIENTE</TableHead>
                    <TableHead className="text-center font-black text-[10px] bg-lime-50">PAGO OPERADOR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosFiltrados.map((v, idx) => {
                    const peso = v.peso_ternium || 0
                    const ingresoTotal = (v.tarifa_cliente || 0) * peso
                    const iva = ingresoTotal * 0.16
                    const retencion = ingresoTotal * 0.04
                    const ingresoNeto = ingresoTotal + iva - retencion
                    const gastosTotales = (v.pension || 0) + (v.gastos_adicionales || 0)
                    const utilidad = ingresoNeto - (v.pago_operador || 0) - (v.total_casetas || 0) - (v.monto_diesel || 0) - gastosTotales
                    const estadoPagoCliente = obtenerEstadoPago(v.id, 'cliente')
                    const estadoPagoOperador = obtenerEstadoPago(v.id, 'operador')
                    
                    return (
                      <TableRow key={v.id || idx} className="hover:bg-zinc-50 border-b">
                        <TableCell className="text-center font-bold text-[11px] border-r">{v.economico}</TableCell>
                        <TableCell className="text-center font-mono text-[10px] border-r">{v.numero_viaje}</TableCell>
                        <TableCell className="text-center text-[10px] font-semibold border-r">{v.cliente}</TableCell>
                        <TableCell className="text-center border-r">
                          <Badge className={`text-[9px] font-black ${
                            v.modalidad === 'FULL' ? 'bg-purple-100 text-purple-700' :
                            v.modalidad === 'SENCILLO' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{v.modalidad}</Badge>
                        </TableCell>
                        <TableCell className="text-center border-r">
                          <Badge className={`text-[9px] font-black ${
                            v.estado_carga === 'CARGADO' ? 'bg-green-100 text-green-700' :
                            'bg-zinc-100 text-zinc-700'
                          }`}>{v.estado_carga}</Badge>
                        </TableCell>
                        <TableCell className="text-center border-r">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold text-blue-600">{v.origen}</span>
                            <ArrowRightLeft size={12} className="text-amber-500 rotate-90" />
                            <span className="text-[9px] font-bold text-green-600">{v.destino}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-purple-50/30 font-black text-purple-700 text-[11px] border-r">
                          {peso ? `${Number(peso).toFixed(3)} Ton` : '---'}
                        </TableCell>
                        <TableCell className="text-center text-[10px] border-r">{v.fecha_inicial}</TableCell>
                        <TableCell className="text-center text-[10px] border-r">{v.fecha_final || '---'}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-[11px] border-r">{v.lts_ticket || '---'}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-[11px] border-r">
                          ${v.monto_diesel?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-[11px] border-r bg-orange-50 text-orange-700">
                          ${(v.pension || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-bold text-[11px] border-r bg-rose-50 text-rose-700">
                          ${(v.gastos_adicionales || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-center font-black text-[12px] border-r ${
                          v.tiene_ruta_operativa ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-500'
                        }`}>
                          ${v.tarifa_cliente?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-center font-black text-[13px] bg-cyan-50 text-cyan-700 border-r">
                          ${ingresoTotal.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-black text-[13px] bg-orange-50 text-orange-700 border-r">
                          ${(ingresoTotal * 0.16).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-black text-[13px] bg-red-50 text-red-700 border-r">
                          ${(ingresoTotal * 0.04).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-black text-[13px] bg-emerald-50 text-emerald-700 border-r">
                          ${(ingresoTotal + (ingresoTotal * 0.16) - (ingresoTotal * 0.04)).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-center font-black text-[12px] border-r ${
                          v.tiene_ruta_operativa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                        }`}>
                          ${v.pago_operador?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className={`text-center font-black text-[12px] border-r ${
                          v.tiene_ruta_operativa ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-500'
                        }`}>
                          ${v.total_casetas?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className={`text-center font-black text-[13px] border-r ${
                          utilidad > 0 ? 'bg-purple-50 text-purple-700' :
                          utilidad < 0 ? 'bg-red-100 text-red-700' :
                          'bg-zinc-100 text-zinc-600'
                        }`}>
                          ${utilidad.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center border-r bg-sky-50/30">
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={estadoPagoCliente}
                              onChange={(e) => actualizarEstadoPago(v.id, 'cliente', e.target.value as any, ingresoTotal)}
                              className="text-[9px] h-7 px-2 border rounded bg-white"
                            >
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="completado">✓ Pagado</option>
                            </select>
                            {estadoPagoCliente === 'completado' && (
                              <button
                                type="button"
                                onClick={() => actualizarEstadoPago(v.id, 'cliente', 'pendiente', ingresoTotal)}
                                className="text-[9px] text-red-600 underline"
                              >
                                Cancelar pago
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-lime-50/30">
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={estadoPagoOperador}
                              onChange={(e) => actualizarEstadoPago(v.id, 'operador', e.target.value as any, v.pago_operador || 0)}
                              className="text-[9px] h-7 px-2 border rounded bg-white"
                            >
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="completado">✓ Pagado</option>
                            </select>
                            {estadoPagoOperador === 'completado' && (
                              <button
                                type="button"
                                onClick={() => actualizarEstadoPago(v.id, 'operador', 'pendiente', v.pago_operador || 0)}
                                className="text-[9px] text-red-600 underline"
                              >
                                Cancelar pago
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
