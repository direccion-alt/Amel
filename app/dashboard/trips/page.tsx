"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { 
  Truck, Fuel, Gauge, MapPin, Clock, PlusCircle, History, 
  AlertTriangle, Calculator, Coins, CheckCircle2, ArrowRightLeft, Loader2, Calendar,
  Building2, Store, Edit3, Settings2, Trash2, Milestone, Timer
} from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8' 
const supabase = createClient(supabaseUrl, supabaseKey)

export default function MonitoreoAmelElite() {
  const [unidades, setUnidades] = useState<any[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [viajes, setViajes] = useState<any[]>([])
  const [allViajes, setAllViajes] = useState<any[]>([])
  const [unidadFilter, setUnidadFilter] = useState<string>('ALL')
  const [clienteFilter, setClienteFilter] = useState<string>('ALL')
  const [origenFilter, setOrigenFilter] = useState<string>('ALL')
  const [destinoFilter, setDestinoFilter] = useState<string>('ALL')
  const [modalidadFilter, setModalidadFilter] = useState<string>('ALL')
  const [estadoCargaFilter, setEstadoCargaFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  
  const [viajeAFinalizar, setViajeAFinalizar] = useState<any>(null)
  const [viajeAIncidencias, setViajeAIncidencias] = useState<any>(null)
  const [viajeAEditar, setViajeAEditar] = useState<any>(null)

  const initialFormState = {
    economico: '', cliente: '', proveedor: '', operador: '', numero_viaje: '', 
    modalidad: 'SENCILLO', estado_carga: 'CARGADO', origen: '', destino: '',
    fecha_inicial: new Date().toISOString().split('T')[0],
    km_inicial: '', es_millas: false, 
    lts_antes_pilot: '', lts_antes_copilot: '',
    lts_cargado_pilot: '', lts_cargado_copilot: '', 
    lts_con_carga_pilot: '', lts_con_carga_copilot: '',
    lts_ticket: '', monto_diesel: '',
    km_incidente1: '', km_incidente2: '', km_incidente3: '',
    pension: '', gastos_adicionales: '', comentarios_gastos: ''
  }

  const [form, setForm] = useState(initialFormState)

  const fetchData = async () => {
    const { data: u } = await supabase.from('unidades').select('economico').eq('estatus', 'Activo').ilike('economico', '%TRAC%').order('economico', { ascending: true })
    const { data: v } = await supabase.from('viajes').select('*').order('created_at', { ascending: false })
    const { data: op } = await supabase.from('operadores').select('*').eq('estatus', 'Activo').order('nombre', { ascending: true })
    if (u) setUnidades(u)
    if (v) { setAllViajes(v); setViajes(v) }
    if (op) setOperadores(op)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    // Aplicar filtros cliente-side sobre allViajes
    let filtered = allViajes.slice()
    if (unidadFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.economico || '').toUpperCase() === unidadFilter)
    }
    if (clienteFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.cliente || '').toUpperCase().includes(clienteFilter.toUpperCase()))
    }
    if (origenFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.origen || '').toUpperCase() === origenFilter)
    }
    if (destinoFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.destino || '').toUpperCase() === destinoFilter)
    }
    if (modalidadFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.modalidad || '').toUpperCase() === modalidadFilter)
    }
    if (estadoCargaFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.estado_carga || '').toUpperCase() === estadoCargaFilter)
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => (t.estatus || '').toUpperCase() === statusFilter)
    }
    setViajes(filtered)
  }, [unidadFilter, clienteFilter, origenFilter, destinoFilter, modalidadFilter, estadoCargaFilter, statusFilter, allViajes])

  const resetForm = () => setForm(initialFormState)

  const handleSave = async () => {
    if (!form.economico || !form.numero_viaje || !form.origen || !form.destino || !form.cliente || !form.proveedor) {
      alert("Faltan campos obligatorios.")
      return
    }
    setLoading(true)
    try {
      const ltsEntraron = ((Number(form.lts_cargado_pilot) - Number(form.lts_antes_pilot)) + (Number(form.lts_cargado_copilot) - Number(form.lts_antes_copilot)));
      const payload = {
        ...form,
        km_inicial: Number(form.km_inicial),
        lts_antes_pilot: Number(form.lts_antes_pilot),
        lts_antes_copilot: Number(form.lts_antes_copilot),
        lts_cargado_pilot: Number(form.lts_cargado_pilot),
        lts_cargado_copilot: Number(form.lts_cargado_copilot),
        lts_con_carga_pilot: Number(form.lts_con_carga_pilot),
        lts_con_carga_copilot: Number(form.lts_con_carga_copilot),
        lts_ticket: Number(form.lts_ticket),
        monto_diesel: Number(form.monto_diesel),
        estatus: 'en ruta',
        lts_cargado_sensores: ltsEntraron,
        diferencia_carga: Number(form.lts_ticket) - ltsEntraron
      }
      const { error } = await supabase.from('viajes').insert([payload])
      if (error) throw error
      setShowNew(false)
      resetForm()
      fetchData()
    } catch (error: any) { alert(error.message) } finally { setLoading(false) }
  }

  const handleFullUpdate = async () => {
    setLoading(true)
    try {
      const ltsEntraron = ((Number(viajeAEditar.lts_cargado_pilot) - Number(viajeAEditar.lts_antes_pilot)) + (Number(viajeAEditar.lts_cargado_copilot) - Number(viajeAEditar.lts_antes_copilot)));
      const { error } = await supabase.from('viajes').update({
        ...viajeAEditar,
        lts_cargado_sensores: ltsEntraron,
        diferencia_carga: Number(viajeAEditar.lts_ticket) - ltsEntraron
      }).eq('id', viajeAEditar.id)
      if (error) throw error
      setViajeAEditar(null)
      fetchData()
    } catch (error: any) { alert(error.message) } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE?`)) return;
    setLoading(true)
    try {
      const { error } = await supabase.from('viajes').delete().eq('id', viajeAEditar.id)
      if (error) throw error
      setViajeAEditar(null)
      fetchData()
    } catch (error: any) { alert(error.message) } finally { setLoading(false) }
  }

const handleUpdateIncidencias = async () => {
  setLoading(true)
  try {
    const { error } = await supabase.from('viajes').update({
      km_incidente1: Number(viajeAIncidencias.km_incidente1) || 0,
      km_incidente2: Number(viajeAIncidencias.km_incidente2) || 0,
      km_incidente3: Number(viajeAIncidencias.km_incidente3) || 0,
      pension: Number(viajeAIncidencias.pension) || 0,
      gastos_adicionales: Number(viajeAIncidencias.gastos_adicionales) || 0,
      comentarios_gastos: viajeAIncidencias.comentarios_gastos?.toUpperCase()
    }).eq('id', viajeAIncidencias.id)
      if (error) throw error
      setViajeAIncidencias(null)
      fetchData()
    } catch (error: any) { alert(error.message) } finally { setLoading(false) }
  }

  const handleFinalizarViaje = async () => {
    setLoading(true)
    try {
      const kmBruto = Number(formCierre.km_final) - Number(viajeAFinalizar.km_inicial)
      const kmIncidentesTotal = (viajeAFinalizar.km_incidente1 || 0) + (viajeAFinalizar.km_incidente2 || 0) + (viajeAFinalizar.km_incidente3 || 0);
      const kmNeto = kmBruto - kmIncidentesTotal;
      const kmEcuacion = viajeAFinalizar.es_millas ? (kmNeto * 1.6) : kmNeto
      const dieselConsumido = ((Number(viajeAFinalizar.lts_cargado_pilot) - Number(formCierre.lts_final_pilot)) + (Number(viajeAFinalizar.lts_cargado_copilot) - Number(formCierre.lts_final_copilot)));
      const rendimientoFinal = dieselConsumido > 0 ? (kmEcuacion / dieselConsumido) : 0
      
      const f_inicio = new Date(viajeAFinalizar.fecha_inicial);
      const f_fin = new Date(formCierre.fecha_final);
      const diffMs = f_fin.getTime() - f_inicio.getTime();
      const diasFinales = Math.floor(diffMs / (1000 * 60 * 60 * 24)) || 0;

      const { error } = await supabase.from('viajes').update({
        ...formCierre,
        km_total: kmBruto, 
        km_total_ecuacion: kmEcuacion, 
        rendimiento: rendimientoFinal,
        dias_totales: diasFinales,
        estatus: 'entregado'
      }).eq('id', viajeAFinalizar.id)
      
      if (error) throw error
      setViajeAFinalizar(null)
      fetchData()
    } catch (error: any) { alert(error.message) } finally { setLoading(false) }
  }

  const [formCierre, setFormCierre] = useState({
    km_final: '', lts_final_pilot: '', lts_final_copilot: '', fecha_final: new Date().toISOString().split('T')[0],
    f_cliente: '', hora_inicio_cliente: '', hora_final_cliente: ''
  })

  return (
    <div className="min-h-screen bg-zinc-50 p-2 md:p-4 text-zinc-900 w-full font-sans">
      <div className="max-w-[1800px] mx-auto space-y-4">
        
        {/* HEADER COMPACTO */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4 border-yellow-400">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">AMEL <span className="text-zinc-400">LOGÍSTICA</span></h1>
          </div>
          <Button onClick={() => { resetForm(); setShowNew(true); }} style={{backgroundColor: AMEL_YELLOW, color: '#000'}} className="font-black italic px-6 h-10 shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" /> NUEVO DESPACHO
          </Button>
        </div>

        {/* PANEL DE FILTROS COMPLETO */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Unidad</label>
              <select value={unidadFilter} onChange={(e) => setUnidadFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                {[...new Set(allViajes.map(v => v.economico))].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Cliente</label>
              <select value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                {[...new Set(allViajes.map(v => v.cliente))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Origen</label>
              <select value={origenFilter} onChange={(e) => setOrigenFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                {[...new Set(allViajes.map(v => v.origen))].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Destino</label>
              <select value={destinoFilter} onChange={(e) => setDestinoFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                {[...new Set(allViajes.map(v => v.destino))].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Modalidad</label>
              <select value={modalidadFilter} onChange={(e) => setModalidadFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                <option value="SENCILLO">SENCILLO</option>
                <option value="FULL">FULL</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Estado</label>
              <select value={estadoCargaFilter} onChange={(e) => setEstadoCargaFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                <option value="CARGADO">CARGADO</option>
                <option value="VACÍO">VACÍO</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                <option value="ALL">Todos</option>
                <option value="EN RUTA">EN RUTA</option>
                <option value="ENTREGADO">ENTREGADO</option>
              </select>
            </div>

            <button onClick={() => { setUnidadFilter('ALL'); setClienteFilter('ALL'); setOrigenFilter('ALL'); setDestinoFilter('ALL'); setModalidadFilter('ALL'); setEstadoCargaFilter('ALL'); setStatusFilter('ALL'); }} className="col-span-2 md:col-span-1 mt-auto text-xs font-bold text-white bg-zinc-600 hover:bg-zinc-700 rounded px-3 py-2 transition-colors">Limpiar Todo</button>
          </div>
        </div>

        {/* TABLA PRINCIPAL OPTIMIZADA */}
<Card className="border-none shadow-2xl bg-white rounded-2xl overflow-hidden">
          <div className="p-3 bg-zinc-900 text-white flex items-center justify-between border-b-2 border-yellow-400">
            <div className="flex items-center gap-2">
              <History size={16} className="text-yellow-400" />
              <h3 className="font-black uppercase italic text-[11px] tracking-widest">Monitor Operativo Amel Elite</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table className="min-w-[4000px] border-separate border-spacing-0 table-fixed">
              <TableHeader className="bg-zinc-50 border-b font-black text-[14px] uppercase text-zinc-500">
                <TableRow className="h-12">
                  <TableHead className="px-4 sticky left-0 bg-zinc-100 z-30 border-r text-center w-[60px] shadow-sm text-zinc-900">Unidad</TableHead>
                  <TableHead className="text-center w-[50px]">Viaje</TableHead>
                  <TableHead className="text-center w-[70px]">Cliente</TableHead>
                  <TableHead className="text-center w-[70px]">Modalidad</TableHead>
                  <TableHead className="text-center w-[70px]">Estado de Carga</TableHead>
                  <TableHead className="text-center w-[100px]">Ruta</TableHead>
                  <TableHead className="text-center border-l italic w-[50px]">Salida</TableHead>
                  <TableHead className="text-center italic w-[50px]">Llegada</TableHead>
                  {/* CABECERA DÍAS: Cambiada a un gris oscuro ejecutivo */}
                  <TableHead className="text-center bg-zinc-200 text-zinc-800 border-r w-[40px]">Días</TableHead>
                  <TableHead className="text-center border-l italic w-[50px]">Antes</TableHead>
                  <TableHead className="text-center italic text-blue-600 w-[50px]">Cargando</TableHead>
                  <TableHead className="text-center italic w-[50px]">Cargado</TableHead>
                  <TableHead className="text-center w-[50px]">Ticket</TableHead>
                  <TableHead className="text-center text-red-600 border-r bg-red-50/50 w-[50px]">Dif.</TableHead>
                  <TableHead className="text-center bg-emerald-50 text-emerald-700 border-r w-[50px]">Gastos</TableHead>
                  <TableHead className="text-center font-bold border-l w-[40px]">Km Inicial</TableHead>
                  <TableHead className="text-center text-orange-700 w-[40px]">Incid.</TableHead>
                  <TableHead className="text-center font-bold w-[40px]">Km Final</TableHead>
                  <TableHead className="text-center bg-zinc-100 w-[40px]">Km Bruto</TableHead>
                  <TableHead className="text-center bg-blue-50/50 text-blue-700 border-x font-black w-[50px]">Km Ecu.</TableHead>
                  <TableHead className="text-center bg-emerald-50 text-emerald-800 border-r font-black italic text-[11px] w-[60px]">Rendimiento</TableHead>
                  <TableHead className="w-[220px]">Comentarios</TableHead>
                  <TableHead className="sticky right-[110px] z-40 bg-zinc-50 border-l text-center w-[40px]">STATUS</TableHead>
                  <TableHead className="sticky right-0 z-40 bg-zinc-50 border-l text-center w-[40px]">GESTIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viajes.map((v) => (
                  <TableRow key={v.id} className="font-medium hover:bg-zinc-50 border-zinc-100 h-12 text-[13px] transition-colors">
                    <TableCell className="font-black text-slate-700 text-[14px] px-4 sticky left-0 bg-white z-10 border-r italic shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {v.economico}
                    </TableCell>

                    <TableCell className="text-zinc-400 font-mono text-[10px]">#{v.numero_viaje}</TableCell>
                    <TableCell className="uppercase truncate font-bold text-slate-600">{v.cliente}</TableCell>
                    
                    <TableCell className="text-center">
                      <Badge className={v.modalidad === 'SENCILLO' ? 
                        "bg-slate-100 text-slate-800 border border-slate-200 font-bold uppercase text-[10px]" :
                        "bg-slate-200 text-slate-900 border border-slate-300 font-bold uppercase text-[10px]"}>
                        {v.modalidad || 'N/A'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className={v.estado_carga === 'CARGADO' ? 
                        "bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase text-[10px]" :
                        "bg-zinc-50 text-zinc-600 border border-zinc-200 font-bold uppercase text-[10px]"}>
                        {v.estado_carga || 'N/A'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2 bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 border border-zinc-200 uppercase">
                        {v.origen} <ArrowRightLeft size={18} className="text-yellow-500" /> {v.destino}
                      </div>
                    </TableCell>

                    <TableCell className="text-center text-zinc-500 font-medium">{v.fecha_inicial}</TableCell>
                    <TableCell className="text-center text-zinc-500 font-medium">{v.fecha_final || '---'}</TableCell>
                    
                    {/* COLUMNA DÍAS: Ahora es texto plano, negrita y fondo sutil */}
                    <TableCell className="text-center bg-zinc-100/50 font-black text-zinc-800 border-r">
                      {v.dias_totales ?? '-'}
                    </TableCell>

                    <TableCell className="text-center text-zinc-600">{(v.lts_antes_pilot + v.lts_antes_copilot).toFixed(1)}</TableCell>
                    <TableCell className="text-center text-blue-500 font-bold italic">{(v.lts_con_carga_pilot + v.lts_con_carga_copilot).toFixed(1)}</TableCell>
                    <TableCell className="text-center text-zinc-600 font-bold">{(v.lts_cargado_pilot + v.lts_cargado_copilot).toFixed(1)}</TableCell>
                    <TableCell className="text-center font-mono font-bold">{v.lts_ticket}</TableCell>

                    <TableCell className="text-center bg-red-50/20 text-red-600 font-black italic">
                      {v.diferencia_carga > 0 ? `+${v.diferencia_carga.toFixed(1)}` : v.diferencia_carga.toFixed(1)}
                    </TableCell>

                    <TableCell className="text-center font-bold text-emerald-700 bg-emerald-50/20">
                      <span className="text-[10px] mr-0.5">$</span>
                      {((v.pension || 0) + (v.gastos_adicionales || 0)).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-center text-zinc-500 font-mono text-[12px]">{v.km_inicial?.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-orange-600/80 font-bold">{(v.km_incidente1 || 0) + (v.km_incidente2 || 0) + (v.km_incidente3 || 0)}</TableCell>
                    <TableCell className="text-center text-zinc-500 font-mono text-[12px] border-r">{v.km_final?.toLocaleString() || '---'}</TableCell>
                    
                    <TableCell className="text-center bg-zinc-50/50 font-bold text-zinc-700">{v.km_total?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-center bg-blue-50/10 border-x border-blue-100">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-blue-700 font-mono font-black text-[13px] tracking-tight">
                          {v.km_total_ecuacion?.toLocaleString() || '-'}
                        </span>

                      </div>
                    </TableCell>

                    {/* RENDIMIENTO: El cuadro ejecutivo Negro/Amarillo */}
                    <TableCell className="text-center p-2 bg-emerald-50/5 border-r border-emerald-100">
                      <div className="flex justify-center">
                        <div className="px-3 py-1 rounded-lg border-2 border-emerald-500/20 bg-emerald-50/40 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-emerald-700 font-black italic text-[14px] leading-none">
                            {v.rendimiento ? v.rendimiento.toFixed(2) : '0.00'}
                          </span>
                          <span className="text-[7px] text-emerald-600/70 font-bold uppercase mt-0.5 tracking-widest">
                            KM/L
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="truncate text-[11px] text-zinc-400 italic px-4 border-l uppercase">{v.comentarios_gastos || '-'}</TableCell>
                    
                    <TableCell className="sticky right-[110px] z-20 bg-white border-l p-0 text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-center items-center w-full px-2">
                        <Badge className={v.estatus === 'en ruta' ? 
                          "bg-amber-100 text-amber-700 border border-amber-200 text-[9px] px-2 shadow-sm w-[55px] justify-center font-bold" : 
                          "bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] px-2 shadow-sm w-[55px] justify-center font-bold"}>
                          {v.estatus?.toUpperCase() === 'EN RUTA' ? 'RUTA' : 'LISTO'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="sticky right-0 z-30 bg-white border-l p-0 text-center shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                      <div className="flex gap-0 justify-center items-center h-full px-2">
                        <button onClick={() => setViajeAIncidencias(v)} className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"><AlertTriangle size={15} /></button>
                        <button onClick={() => setViajeAEditar(v)} className="p-2 hover:bg-amber-50 rounded-full text-amber-600 transition-colors"><Edit3 size={15} /></button>
                        {v.estatus === 'en ruta' && (
                          <button onClick={() => setViajeAFinalizar(v)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-900 transition-colors"><CheckCircle2 size={15} /></button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MODALES: APERTURA, CORREGIR, INCIDENCIAS, FINALIZAR (SIN CAMBIOS ESTRUCTURALES) */}
      
      {/* 1. APERTURA */}
      <Dialog open={showNew} onOpenChange={(open) => { if(!open) resetForm(); setShowNew(open); }}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1300px] bg-white p-0 rounded-3xl overflow-hidden shadow-2xl border-none">
          <div className="bg-zinc-900 p-8 text-white border-b-4 border-yellow-400 flex justify-between items-center"><h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3"><Truck className="text-yellow-400 h-8 w-8" /> Apertura de Despacho</h2></div>
          <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12 bg-white">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><Building2 size={16}/> Datos Flete</h3>
              <select className="w-full border-2 p-3 rounded-xl font-bold bg-zinc-50 text-sm" value={form.economico} onChange={(e) => setForm({...form, economico: e.target.value})}><option value="">Unidad...</option>{unidades.map(u => <option key={u.economico} value={u.economico}>{u.economico}</option>)}</select>
              <Input placeholder="NÚMERO VIAJE" value={form.numero_viaje} onChange={(e) => setForm({...form, numero_viaje: e.target.value.toUpperCase()})} />
              <Input placeholder="CLIENTE" className="uppercase" onChange={(e) => setForm({...form, cliente: e.target.value.toUpperCase()})} />
              <Input placeholder="PROVEEDOR" className="uppercase" onChange={(e) => setForm({...form, proveedor: e.target.value.toUpperCase()})} />
              <select className="w-full border-2 p-3 rounded-xl font-bold bg-zinc-50 text-sm" value={form.operador} onChange={(e) => setForm({...form, operador: e.target.value})}><option value="">Seleccionar Operador...</option>{operadores.map(op => <option key={op.id} value={`${op.nombre} ${op.apellido}`}>{op.nombre} {op.apellido}</option>)}</select>
              <div className="grid grid-cols-2 gap-4">
                <select className="border-2 p-3 rounded-xl font-bold text-xs" value={form.modalidad} onChange={(e) => setForm({...form, modalidad: e.target.value})}><option value="SENCILLO">SENCILLO</option><option value="FULL">FULL</option></select>
                <select className="border-2 p-3 rounded-xl font-bold text-xs" value={form.estado_carga} onChange={(e) => setForm({...form, estado_carga: e.target.value})}><option value="CARGADO">CARGADO</option><option value="VACIO">VACÍO</option></select>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><MapPin size={16}/> Trayecto</h3>
              <div className="grid grid-cols-2 gap-4"><Input placeholder="ORIGEN" className="uppercase h-12" onChange={(e) => setForm({...form, origen: e.target.value.toUpperCase()})} /><Input placeholder="DESTINO" className="uppercase h-12" onChange={(e) => setForm({...form, destino: e.target.value.toUpperCase()})} /></div>
              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 text-center shadow-inner">
                <label className="text-[11px] font-black text-blue-700 italic uppercase">KM Inicial</label>
                <Input type="number" placeholder="0.00" className="font-black text-4xl h-16 text-center border-none bg-transparent" value={form.km_inicial} onChange={(e) => setForm({...form, km_inicial: e.target.value})} />
                <div className="flex items-center justify-center gap-2 mt-2"><input type="checkbox" checked={form.es_millas} onChange={(e) => setForm({...form, es_millas: e.target.checked})} /><span className="text-[10px] font-black uppercase">Unidad Americana (Millas)</span></div>
              </div>
              <Input type="date" value={form.fecha_inicial} onChange={(e) => setForm({...form, fecha_inicial: e.target.value})} />
            </div>
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><Fuel size={16}/> Diesel Inicial</h3>
              <div className="bg-zinc-50 p-6 rounded-3xl border space-y-4 shadow-inner">
                <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase">
                  <div>Antes P <Input type="number" placeholder="0.00" value={form.lts_antes_pilot} onChange={(e) => setForm({...form, lts_antes_pilot: e.target.value})} /></div>
                  <div>Antes C <Input type="number" placeholder="0.00" value={form.lts_antes_copilot} onChange={(e) => setForm({...form, lts_antes_copilot: e.target.value})} /></div>
                  <div className="text-blue-600 font-bold italic">Cargando P <Input type="number" placeholder="0.00" className="border-blue-300" value={form.lts_con_carga_pilot} onChange={(e) => setForm({...form, lts_con_carga_pilot: e.target.value})} /></div>
                  <div className="text-blue-600 font-bold italic">Cargando C <Input type="number" placeholder="0.00" className="border-blue-300" value={form.lts_con_carga_copilot} onChange={(e) => setForm({...form, lts_con_carga_copilot: e.target.value})} /></div>
                  <div className="text-yellow-600 italic">Cargado P <Input type="number" placeholder="0.00" className="border-yellow-400" value={form.lts_cargado_pilot} onChange={(e) => setForm({...form, lts_cargado_pilot: e.target.value})} /></div>
                  <div className="text-yellow-600 italic">Cargado C <Input type="number" placeholder="0.00" className="border-yellow-400" value={form.lts_cargado_copilot} onChange={(e) => setForm({...form, lts_cargado_copilot: e.target.value})} /></div>
                </div>
                <Input placeholder="LTS TICKET" type="number" className="font-black border-2 border-zinc-900 h-12" value={form.lts_ticket} onChange={(e) => setForm({...form, lts_ticket: e.target.value})} />
                <Input placeholder="MONTO TOTAL $" type="number" className="font-black border-2 border-green-600 h-10 text-green-700 bg-green-50 text-center" value={form.monto_diesel} onChange={(e) => setForm({...form, monto_diesel: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-zinc-50 border-t flex justify-center"><Button className="w-full md:max-w-2xl h-16 font-black text-2xl skew-x-[-5deg]" style={{backgroundColor: AMEL_YELLOW, color: '#000'}} onClick={handleSave} disabled={loading}>AUTORIZAR Y REGISTRAR SALIDA</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. CORREGIR DESPACHO */}
      <Dialog open={!!viajeAEditar} onOpenChange={() => setViajeAEditar(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1300px] bg-white p-0 rounded-3xl overflow-hidden shadow-2xl border-none">
          <div className="bg-amber-500 p-8 text-white border-b-4 border-black/10 flex justify-between items-center"><h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3"><Settings2 className="h-8 w-8" /> Corregir Despacho</h2><Badge className="bg-black/20 text-white border-none uppercase font-black px-4 italic">{viajeAEditar?.economico}</Badge></div>
          <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12 bg-white max-h-[65vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><Building2 size={16}/> Datos Flete</h3>
              <Input placeholder="CLIENTE" value={viajeAEditar?.cliente} onChange={(e) => setViajeAEditar({...viajeAEditar, cliente: e.target.value.toUpperCase()})} />
              <Input placeholder="PROVEEDOR" value={viajeAEditar?.proveedor} onChange={(e) => setViajeAEditar({...viajeAEditar, proveedor: e.target.value.toUpperCase()})} />
              <Input placeholder="NÚMERO VIAJE" value={viajeAEditar?.numero_viaje} onChange={(e) => setViajeAEditar({...viajeAEditar, numero_viaje: e.target.value.toUpperCase()})} />
              <Input placeholder="OPERADOR" value={viajeAEditar?.operador} onChange={(e) => setViajeAEditar({...viajeAEditar, operador: e.target.value.toUpperCase()})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="border-2 p-3 rounded-xl font-bold text-xs" value={viajeAEditar?.modalidad} onChange={(e) => setViajeAEditar({...viajeAEditar, modalidad: e.target.value})}><option value="SENCILLO">SENCILLO</option><option value="FULL">FULL</option></select>
                <select className="border-2 p-3 rounded-xl font-bold text-xs" value={viajeAEditar?.estado_carga} onChange={(e) => setViajeAEditar({...viajeAEditar, estado_carga: e.target.value})}><option value="CARGADO">CARGADO</option><option value="VACIO">VACÍO</option></select>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><MapPin size={16}/> Trayecto</h3>
              <div className="grid grid-cols-2 gap-4"><Input value={viajeAEditar?.origen} onChange={(e) => setViajeAEditar({...viajeAEditar, origen: e.target.value.toUpperCase()})} /><Input value={viajeAEditar?.destino} onChange={(e) => setViajeAEditar({...viajeAEditar, destino: e.target.value.toUpperCase()})} /></div>
              <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 text-center shadow-inner"><label className="text-[11px] font-black text-amber-700 italic uppercase">KM Inicial</label><Input type="number" className="font-black text-4xl h-16 text-center border-none bg-transparent" value={viajeAEditar?.km_inicial} onChange={(e) => setViajeAEditar({...viajeAEditar, km_inicial: e.target.value})} /></div>
              <Input type="date" value={viajeAEditar?.fecha_inicial} onChange={(e) => setViajeAEditar({...viajeAEditar, fecha_inicial: e.target.value})} />
            </div>
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase border-b pb-2"><Fuel size={16}/> Diesel</h3>
              <div className="bg-zinc-50 p-6 rounded-3xl border space-y-4 shadow-inner">
                <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase">
                   Antes P <Input type="number" value={viajeAEditar?.lts_antes_pilot} onChange={(e) => setViajeAEditar({...viajeAEditar, lts_antes_pilot: e.target.value})} />
                   Antes C <Input type="number" value={viajeAEditar?.lts_antes_copilot} onChange={(e) => setViajeAEditar({...viajeAEditar, lts_antes_copilot: e.target.value})} />
                   Final P <Input type="number" value={viajeAEditar?.lts_cargado_pilot} onChange={(e) => setViajeAEditar({...viajeAEditar, lts_cargado_pilot: e.target.value})} />
                   Final C <Input type="number" value={viajeAEditar?.lts_cargado_copilot} onChange={(e) => setViajeAEditar({...viajeAEditar, lts_cargado_copilot: e.target.value})} />
                   Ticket <Input type="number" className="col-span-2 border-zinc-900 font-black h-10 text-center" value={viajeAEditar?.lts_ticket} onChange={(e) => setViajeAEditar({...viajeAEditar, lts_ticket: e.target.value})} />
                   <Input placeholder="MONTO TOTAL $" type="number" className="col-span-2 font-black border-2 border-green-600 h-10 text-green-700 bg-green-50 text-center" value={viajeAEditar?.monto_diesel} onChange={(e) => setViajeAEditar({...viajeAEditar, monto_diesel: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-zinc-100 border-t flex justify-between gap-4">
            <Button variant="destructive" className="h-16 px-8 font-black uppercase flex gap-2 shadow-lg" onClick={handleDelete} disabled={loading}><Trash2 size={20}/> ELIMINAR</Button>
            <Button className="flex-1 h-16 font-black text-xl bg-black text-white hover:bg-zinc-800 shadow-xl" onClick={handleFullUpdate} disabled={loading}>CONFIRMAR CORRECCIONES</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. INCIDENCIAS */}
      <Dialog open={!!viajeAIncidencias} onOpenChange={() => setViajeAIncidencias(null)}>
        <DialogContent className="max-w-[800px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-blue-600 p-6 text-white flex justify-between items-center"><h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><AlertTriangle /> Incidentes y Gastos</h2></div>
          <div className="p-8 grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-red-500 border-b pb-2 tracking-widest">KM Incidentes</h4>
            {/* Agregamos el placeholder que sirve como comentario guía */}
            <Input type="number" placeholder="Km Incidente1" value={viajeAIncidencias?.km_incidente1 === 0 || viajeAIncidencias?.km_incidente1 === '0' ? '' : viajeAIncidencias?.km_incidente1} onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, km_incidente1: e.target.value})}/>
            <Input type="number" placeholder="Km Incidente2" value={viajeAIncidencias?.km_incidente2 === 0 || viajeAIncidencias?.km_incidente2 === '0' ? '' : viajeAIncidencias?.km_incidente2} onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, km_incidente2: e.target.value})}/>
            <Input type="number" placeholder="Km Incidente3" value={viajeAIncidencias?.km_incidente3 === 0 || viajeAIncidencias?.km_incidente3 === '0' ? '' : viajeAIncidencias?.km_incidente3} onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, km_incidente3: e.target.value})}/>

          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-green-600 border-b pb-2 tracking-widest">Gastos extras en ruta</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold">PENSIÓN $</label>
                <Input type="number" placeholder="Monto $..." value={viajeAIncidencias?.pension === 0 || viajeAIncidencias?.pension === '0' ? '' : viajeAIncidencias?.pension} onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, pension: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold">OTROS $</label>
                <Input type="number" placeholder="Monto $..." value={viajeAIncidencias?.gastos_adicionales === 0 || viajeAIncidencias?.gastos_adicionales === '0' ? '' : viajeAIncidencias?.gastos_adicionales} onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, gastos_adicionales: e.target.value})} />
              </div>
            </div>
            {/* Comentario guía dentro del área de texto */}
            <textarea 
              className="w-full border-2 rounded-xl p-3 text-sm font-bold min-h-[120px] uppercase bg-zinc-50" 
              placeholder="ESCRIBA AQUÍ EL MOTIVO DE LOS GASTOS O INCIDENTES..."
              value={viajeAIncidencias?.comentarios_gastos} 
              onChange={(e) => setViajeAIncidencias({...viajeAIncidencias, comentarios_gastos: e.target.value})} 
            />
          </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50 border-t border-zinc-100"><Button className="w-full h-14 font-black bg-blue-600 text-white rounded-xl shadow-md" onClick={handleUpdateIncidencias} disabled={loading}>ACTUALIZAR RUTA</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. FINALIZAR */}
      <Dialog open={!!viajeAFinalizar} onOpenChange={() => setViajeAFinalizar(null)}>
        <DialogContent className="max-w-[700px] bg-white rounded-3xl p-8 shadow-2xl border-none">
          <div className="flex items-center gap-3 mb-8 border-b pb-4 text-green-600"><CheckCircle2 size={32} /> <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Finalizar Viaje</h2></div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-zinc-400 tracking-widest italic">Km Final Tablero</label>
              <Input type="number" placeholder="KM FINAL" className="h-14 text-2xl font-black border-zinc-900" value={formCierre.km_final} onChange={(e) => setFormCierre({...formCierre, km_final: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="FIN P" className="font-bold h-11 text-center" value={formCierre.lts_final_pilot} onChange={(e) => setFormCierre({...formCierre, lts_final_pilot: e.target.value})} /><Input type="number" placeholder="FIN C" className="font-bold h-11 text-center" value={formCierre.lts_final_copilot} onChange={(e) => setFormCierre({...formCierre, lts_final_copilot: e.target.value})} /></div>
              <Input type="date" value={formCierre.fecha_final} onChange={(e) => setFormCierre({...formCierre, fecha_final: e.target.value})} />
            </div>
            <div className="bg-zinc-50 p-6 rounded-3xl space-y-2 border border-zinc-200 shadow-inner">
              <h4 className="text-[10px] font-black uppercase italic text-blue-600 flex items-center gap-2"><Clock size={14}/> Estadía Cliente</h4>
              <Input type="date" className="h-9 text-xs mb-1" onChange={(e) => setFormCierre({...formCierre, f_cliente: e.target.value})} />
              <Input type="time" className="h-9 text-xs mb-1" onChange={(e) => setFormCierre({...formCierre, hora_inicio_cliente: e.target.value})} />
              <Input type="time" className="h-9 text-xs mb-1" onChange={(e) => setFormCierre({...formCierre, hora_final_cliente: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="mt-8"><Button className="w-full h-16 font-black text-xl bg-green-500 text-white rounded-2xl shadow-xl hover:bg-green-600 transition-all" onClick={handleFinalizarViaje} disabled={loading}>FINALIZAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}