"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PlusCircle, Trash2, Search, Eye, EyeOff, Edit2 } from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8'
const supabase = createClient(supabaseUrl, supabaseKey)

const MODALIDADES = ['TRACTO', 'SENCILLO', 'FULL']
const ESTADOS_CARGA = ['CARGADO', 'VACIO']
const TIPOS_VIAJE = ['IDA', 'REGRESO']

export default function RutasOperativas() {
  const [rutas, setRutas] = useState<any[]>([])
  const [filtro, setFiltro] = useState("")
  const [verInactivos, setVerInactivos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rutaEditando, setRutaEditando] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [nuevaRuta, setNuevaRuta] = useState({
    origen: '',
    destino: '',
    modalidad: 'TRACTO',
    estado_carga: 'CARGADO',
    tipo_viaje: 'IDA',
    costo_ruta: 0,
    pago_operador: 0,
    estatus: 'Activo'
  })

  const fetchRutas = async () => {
    try {
      const { data: rutasData, error: rutasError } = await supabase
        .from('rutas_operativas')
        .select('*')
        .order('origen')

      if (rutasError) {
        console.error('Error fetching rutas:', rutasError)
        return
      }

      const { data: rutaCasetasData, error: rutaCasetasError } = await supabase
        .from('ruta_casetas')
        .select(`
          ruta_id,
          cantidad,
          casetas_catalogo:caseta_id(
            precio_tracto,
            precio_sencillo,
            precio_full,
            precio_tracto_ida,
            precio_tracto_regreso,
            precio_sencillo_ida,
            precio_sencillo_regreso,
            precio_full_ida,
            precio_full_regreso
          )
        `)

      if (rutaCasetasError) {
        console.error('Error fetching ruta_casetas:', rutaCasetasError)
        if (rutasData) setRutas(rutasData)
        return
      }

      if (rutasData) {
        const totalPorRuta = (rutaCasetasData || []).reduce((acc: Record<string, number>, rc: any) => {
          const rutaId = rc.ruta_id
          if (!rutaId) return acc
          acc[rutaId] = acc[rutaId] || 0
          acc[rutaId] += (rc._tmp_total ?? 0)
          return acc
        }, {})

        const rutasConTotales = rutasData.map((ruta: any) => {
          const casetasDeRuta = (rutaCasetasData || []).filter((rc: any) => rc.ruta_id === ruta.id)
          const totalCasetas = casetasDeRuta.reduce((sum: number, rc: any) => {
            const catalogo = rc.casetas_catalogo || {}
            const cantidad = Number(rc.cantidad || 1)
            const modalidad = (ruta.modalidad || '').toUpperCase()
            const tipoViaje = (ruta.tipo_viaje || 'IDA').toUpperCase()
            const precio = modalidad === 'FULL'
              ? (tipoViaje === 'REGRESO'
                  ? Number(catalogo.precio_full_regreso || catalogo.precio_full || 0)
                  : Number(catalogo.precio_full_ida || catalogo.precio_full || 0))
              : modalidad === 'SENCILLO'
                ? (tipoViaje === 'REGRESO'
                    ? Number(catalogo.precio_sencillo_regreso || catalogo.precio_sencillo || 0)
                    : Number(catalogo.precio_sencillo_ida || catalogo.precio_sencillo || 0))
                : (tipoViaje === 'REGRESO'
                    ? Number(catalogo.precio_tracto_regreso || catalogo.precio_tracto || 0)
                    : Number(catalogo.precio_tracto_ida || catalogo.precio_tracto || 0))
            return sum + (precio * cantidad)
          }, 0)
          return { ...ruta, total_casetas: totalCasetas }
        })

        setRutas(rutasConTotales)
      }
    } catch (err) {
      console.error('Error en fetchRutas:', err)
    }
  }

  useEffect(() => { fetchRutas() }, [])

  const handleCreateRoute = async () => {
    if (!nuevaRuta.origen || !nuevaRuta.destino) return alert("Origen y Destino son obligatorios")
    setLoading(true)
    const { error } = await supabase.from('rutas_operativas').insert([{
      origen: nuevaRuta.origen,
      destino: nuevaRuta.destino,
      modalidad: nuevaRuta.modalidad,
      estado_carga: nuevaRuta.estado_carga,
      tipo_viaje: nuevaRuta.tipo_viaje,
      costo_ruta: parseFloat(nuevaRuta.costo_ruta) || 0,
      pago_operador: parseFloat(nuevaRuta.pago_operador) || 0,
      estatus: nuevaRuta.estatus
    }])
    if (!error) {
      setShowNewModal(false)
      setNuevaRuta({ origen: '', destino: '', modalidad: 'TRACTO', estado_carga: 'CARGADO', tipo_viaje: 'IDA', costo_ruta: 0, pago_operador: 0, estatus: 'Activo' })
      await fetchRutas()
    } else alert(error.message)
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!rutaEditando) return
    if (!rutaEditando.origen || !rutaEditando.destino) return alert("Origen y Destino son obligatorios")
    setLoading(true)
    
    console.log('Actualizando ruta con ID:', rutaEditando.id, rutaEditando)
    
    const { error } = await supabase.from('rutas_operativas').update({
      origen: rutaEditando.origen,
      destino: rutaEditando.destino,
      modalidad: rutaEditando.modalidad,
      estado_carga: rutaEditando.estado_carga,
      tipo_viaje: rutaEditando.tipo_viaje,
      costo_ruta: parseFloat(rutaEditando.costo_ruta) || 0,
      pago_operador: parseFloat(rutaEditando.pago_operador) || 0,
      estatus: rutaEditando.estatus,
      updated_at: new Date().toISOString()
    }).eq('id', rutaEditando.id)
    
    if (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar: ' + error.message)
    } else {
      console.log('Ruta actualizada exitosamente')
      await fetchRutas()
      setRutaEditando(null)
      setShowEditModal(false)
      alert('Ruta actualizada correctamente')
    }
    setLoading(false)
  }

  const handleDeleteRoute = async () => {
    if (!rutaEditando?.id) return
    const confirmado = confirm(`¿Eliminar la ruta ${rutaEditando.origen} → ${rutaEditando.destino}? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    setLoading(true)
    const { error } = await supabase.from('rutas_operativas').delete().eq('id', rutaEditando.id)
    if (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar: ' + error.message)
    } else {
      await fetchRutas()
      setRutaEditando(null)
      setShowEditModal(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">RUTAS <span style={{ color: AMEL_YELLOW }}>OPERATIVAS</span></h1>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <Button 
              variant="outline" 
              className={`font-bold transition-all ${verInactivos ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white'}`}
              onClick={() => setVerInactivos(!verInactivos)}
            >
              {verInactivos ? <Eye className="mr-2 h-4 w-4"/> : <EyeOff className="mr-2 h-4 w-4"/>}
              {verInactivos ? "MOSTRAR ACTIVAS" : "VER INACTIVAS"}
            </Button>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input placeholder="Buscar ruta..." className="pl-10 shadow-sm bg-white" onChange={(e) => setFiltro(e.target.value)} />
            </div>

            <Button onClick={() => setShowNewModal(true)} className="font-black bg-zinc-900 text-white hover:bg-zinc-800">
              <PlusCircle className="mr-2 h-4 w-4" /> NUEVA RUTA
            </Button>
          </div>
        </div>

        {/* TABLA DE RUTAS */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-100">
                    <th className="px-4 py-3 text-left font-black uppercase text-[11px]">Origen → Destino</th>
                    <th className="px-4 py-3 text-left font-black uppercase text-[11px]">Modalidad</th>
                    <th className="px-4 py-3 text-left font-black uppercase text-[11px]">Estado Carga</th>
                    <th className="px-4 py-3 text-right font-black uppercase text-[11px]">Tarifa Cliente</th>
                    <th className="px-4 py-3 text-right font-black uppercase text-[11px]">Pago Operador</th>
                    <th className="px-4 py-3 text-right font-black uppercase text-[11px]">Total Casetas</th>
                    <th className="px-4 py-3 text-center font-black uppercase text-[11px]">Estado</th>
                    <th className="px-4 py-3 text-center font-black uppercase text-[11px]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas
                    .filter(r => {
                      const matchesSearch = `${r.origen} ${r.destino}`.toLowerCase().includes(filtro.toLowerCase());
                      const matchesStatus = verInactivos ? r.estatus === 'Inactivo' : r.estatus === 'Activo';
                      return matchesSearch && matchesStatus;
                    })
                    .map((ruta) => {
                      const totalCasetas = (ruta.total_casetas ?? ruta.casetas ?? 0)
                      return (
                        <tr key={ruta.id} className="border-b hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 font-bold">{ruta.origen} → {ruta.destino}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{ruta.modalidad}</Badge></td>
                          <td className="px-4 py-3"><Badge variant="secondary">{ruta.estado_carga}</Badge></td>
                          <td className="px-4 py-3 text-right font-bold">${ruta.costo_ruta.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold">${ruta.pago_operador.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold">${totalCasetas.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={ruta.estatus === 'Activo' ? 
                              "bg-green-100 text-green-800 border border-green-300 font-bold uppercase text-[10px]" :
                              "bg-red-100 text-red-800 border border-red-300 font-bold uppercase text-[10px]"}>
                              {ruta.estatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setRutaEditando(ruta)
                                setShowEditModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit2 size={18} />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* MODAL PARA EDITAR RUTA */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-white max-w-md max-h-[95vh] overflow-y-auto flex flex-col">
            <DialogHeader className="border-b pb-2 sticky top-0 bg-white">
              <DialogTitle className="font-black uppercase italic">Editar Ruta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Origen" value={rutaEditando?.origen || ''} onChange={(e) => setRutaEditando({...rutaEditando, origen: e.target.value})} />
                <Input placeholder="Destino" value={rutaEditando?.destino || ''} onChange={(e) => setRutaEditando({...rutaEditando, destino: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Modalidad</label>
                  <select value={rutaEditando?.modalidad || 'SECO'} onChange={(e) => setRutaEditando({...rutaEditando, modalidad: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Estado Carga</label>
                  <select value={rutaEditando?.estado_carga || 'COMPLETO'} onChange={(e) => setRutaEditando({...rutaEditando, estado_carga: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {ESTADOS_CARGA.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tipo Viaje</label>
                  <select value={rutaEditando?.tipo_viaje || 'IDA'} onChange={(e) => setRutaEditando({...rutaEditando, tipo_viaje: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {TIPOS_VIAJE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tarifa Cliente</label>
                  <Input type="number" step="0.01" value={rutaEditando?.costo_ruta || 0} onChange={(e) => setRutaEditando({...rutaEditando, costo_ruta: parseFloat(e.target.value) || 0})} />
                  <p className="text-[8px] text-zinc-400 mt-1">Lo que paga el cliente</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Pago Operador</label>
                  <Input type="number" step="0.01" value={rutaEditando?.pago_operador || 0} onChange={(e) => setRutaEditando({...rutaEditando, pago_operador: parseFloat(e.target.value) || 0})} />
                  <p className="text-[8px] text-zinc-400 mt-1">Por este tramo</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-100 rounded-lg">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Estado</span>
                <select 
                  className="text-xs font-bold p-1 rounded border bg-white"
                  value={rutaEditando?.estatus || 'Activo'}
                  onChange={(e) => setRutaEditando({...rutaEditando, estatus: e.target.value})}
                >
                  <option value="Activo">ACTIVO</option>
                  <option value="Inactivo">INACTIVO</option>
                </select>
              </div>
            </div>
            <div className="border-t pt-4 mt-6 flex flex-col gap-2">
              <Button className="w-full font-black h-12" style={{backgroundColor: AMEL_YELLOW}} onClick={handleUpdate} disabled={loading}>GUARDAR CAMBIOS</Button>
              <Button variant="destructive" className="w-full font-black h-12" onClick={handleDeleteRoute} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" /> ELIMINAR RUTA
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL PARA NUEVA RUTA */}
        <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
          <DialogContent className="bg-white max-w-md max-h-[95vh] overflow-y-auto flex flex-col">
            <DialogHeader className="border-b pb-2 sticky top-0 bg-white">
              <DialogTitle className="font-black uppercase italic">Nueva Ruta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Origen" value={nuevaRuta.origen} onChange={(e) => setNuevaRuta({...nuevaRuta, origen: e.target.value})} />
                <Input placeholder="Destino" value={nuevaRuta.destino} onChange={(e) => setNuevaRuta({...nuevaRuta, destino: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Modalidad</label>
                  <select value={nuevaRuta.modalidad} onChange={(e) => setNuevaRuta({...nuevaRuta, modalidad: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Estado Carga</label>
                  <select value={nuevaRuta.estado_carga} onChange={(e) => setNuevaRuta({...nuevaRuta, estado_carga: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {ESTADOS_CARGA.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tipo Viaje</label>
                  <select value={nuevaRuta.tipo_viaje} onChange={(e) => setNuevaRuta({...nuevaRuta, tipo_viaje: e.target.value})} className="w-full border-2 rounded px-3 py-2 font-bold bg-white">
                    {TIPOS_VIAJE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tarifa Cliente</label>
                  <Input type="number" step="0.01" value={nuevaRuta.costo_ruta} onChange={(e) => setNuevaRuta({...nuevaRuta, costo_ruta: parseFloat(e.target.value) || 0})} />
                  <p className="text-[8px] text-zinc-400 mt-1">Lo que paga el cliente</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Pago Operador</label>
                  <Input type="number" step="0.01" value={nuevaRuta.pago_operador} onChange={(e) => setNuevaRuta({...nuevaRuta, pago_operador: parseFloat(e.target.value) || 0})} />
                  <p className="text-[8px] text-zinc-400 mt-1">Por este tramo</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mt-6 flex flex-col gap-2">
              <Button className="w-full font-black h-12" style={{backgroundColor: AMEL_YELLOW}} onClick={handleCreateRoute} disabled={loading}>CREAR RUTA</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
