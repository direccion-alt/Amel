"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Fuel, PlusCircle, DollarSign, Droplet, TrendingUp, Filter, Upload, Download, Eye, Trash2, Truck, FileText
} from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function CombustibleAmel() {
  const [combustibles, setCombustibles] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNuevo, setShowNuevo] = useState(false)
  const [verDetalle, setVerDetalle] = useState<any>(null)
  
  // Filtros
  const [filtroUnidad, setFiltroUnidad] = useState('ALL')
  const [filtroEstacion, setFiltroEstacion] = useState('ALL')

  // Formulario nueva carga
  const [form, setForm] = useState({
    economico: '',
    fecha_carga: new Date().toISOString().split('T')[0],
    litros: '',
    monto_pagado: '',
    precio_por_litro: '',
    estacion_proveedor: '',
    folio_ticket: '',
    notas: ''
  })

  // Estado para archivo de ticket
  const [archivoTicket, setArchivoTicket] = useState<File | null>(null)
  const [escaneandoIA, setEscaneandoIA] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: c, error: errC } = await supabase.from('combustible').select('*').order('fecha_carga', { ascending: false })
    const { data: u, error: errU } = await supabase.from('unidades').select('economico, tipo').eq('estatus', 'Activo').order('economico')
    
    if (errC) console.error('Error fetching combustible:', errC)
    if (errU) console.error('Error fetching unidades:', errU)
    
    if (c) setCombustibles(c)
    if (u) setUnidades(u)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Aplicar filtros
  const combustiblesFiltrados = combustibles.filter(c => {
    if (filtroUnidad !== 'ALL' && c.economico !== filtroUnidad) return false
    if (filtroEstacion !== 'ALL' && c.estacion_proveedor !== filtroEstacion) return false
    return true
  })

  // Calcular estadísticas
  const stats = {
    totalCargas: combustiblesFiltrados.length,
    totalLitros: combustiblesFiltrados.reduce((sum, c) => sum + (c.litros || 0), 0),
    totalInvertido: combustiblesFiltrados.reduce((sum, c) => sum + (c.monto_pagado || 0), 0),
    totalConIva: combustiblesFiltrados.reduce((sum, c) => sum + ((c.monto_pagado || 0) * 1.16), 0),
    promedioPorLitro: combustiblesFiltrados.length > 0 
      ? combustiblesFiltrados.reduce((sum, c) => sum + (c.precio_por_litro || 0), 0) / combustiblesFiltrados.length 
      : 0
  }

  // Subir ticket a Supabase Storage
  const subirTicket = async (file: File, economico: string, fecha: string, folio: string): Promise<string | null> => {
    try {
      const extension = file.name.split('.').pop()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const anio = fecha.split('-')[0]
      const mes = fecha.split('-')[1]
      
      const rutaArchivo = `${anio}/${mes}/${economico}_${timestamp}_${folio || 'SIN_FOLIO'}.${extension}`
      
      const { data, error } = await supabase.storage
        .from('tickets-combustible')
        .upload(rutaArchivo, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      const { data: urlData } = supabase.storage
        .from('tickets-combustible')
        .getPublicUrl(rutaArchivo)
      
      return urlData.publicUrl
    } catch (error: any) {
      console.error('⚠️ Advertencia - No se pudo subir ticket:', error.message)
      return null
    }
  }

  const escanearTicketConIA = async (file: File) => {
    setEscaneandoIA(true)
    try {
      console.log('📸 Iniciando escaneo de ticket...')
      const formData = new FormData()
      formData.append('file', file)

      console.log('🌐 Enviando a /api/escanear-combustible...')
      const response = await fetch('/api/escanear-combustible', {
        method: 'POST',
        body: formData
      })

      console.log('📨 Respuesta recibida. Status:', response.status)
      const responseData = await response.json()
      
      console.log('📝 Datos de respuesta:', responseData)

      if (!response.ok) {
        const errorMsg = responseData.details || responseData.error || 'Error desconocido'
        throw new Error(`[${response.status}] ${errorMsg}`)
      }

      if (!responseData.datos) {
        throw new Error('Respuesta inválida del API')
      }

      const { datos } = responseData
      console.log('✅ Datos extraídos:', datos)

      // Autocompletar formulario
      setForm(prev => ({
        ...prev,
        litros: datos.litros?.toString() || prev.litros,
        monto_pagado: datos.monto_pagado?.toString() || prev.monto_pagado,
        precio_por_litro: datos.precio_por_litro?.toString() || prev.precio_por_litro,
        estacion_proveedor: datos.estacion_proveedor || prev.estacion_proveedor,
        folio_ticket: datos.folio_ticket || prev.folio_ticket,
        notas: datos.notas || prev.notas
      }))

      setArchivoTicket(file)
      alert('✅ Ticket escaneado exitosamente! Revisa los campos autocompletados.')
    } catch (error: any) {
      console.error('❌ Error escaneando:', error)
      const errorMsg = error.message || 'Error desconocido'
      alert(`⚠️ El escaneo con IA no está disponible.\n\nUsa "SUBIR SIN ESCANEAR" para cargar el ticket manualmente.\n\nError: ${errorMsg}`)
    } finally {
      setEscaneandoIA(false)
    }
  }

  const handleGuardarCombustible = async () => {
    if (!form.economico || !form.litros || !form.monto_pagado) {
      alert('Completa los campos obligatorios: Unidad, Litros, Monto')
      return
    }

    setLoading(true)
    
    try {
      let ticketUrl = null
      
      if (archivoTicket) {
        ticketUrl = await subirTicket(
          archivoTicket,
          form.economico,
          form.fecha_carga,
          form.folio_ticket
        )
      }

      // Calcular precio por litro si no se especificó
      const precioPorLitro = form.precio_por_litro ? Number(form.precio_por_litro) : (Number(form.monto_pagado) / Number(form.litros))

      const payload = {
        economico: form.economico,
        fecha_carga: form.fecha_carga,
        litros: Number(form.litros),
        monto_pagado: Number(form.monto_pagado),
        precio_por_litro: precioPorLitro,
        estacion_proveedor: form.estacion_proveedor || null,
        folio_ticket: form.folio_ticket || null,
        ticket_url: ticketUrl,
        ticket_nombre: archivoTicket?.name || null,
        ticket_size: archivoTicket?.size || null,
        ticket_tipo: archivoTicket?.type || null,
        notas: form.notas || null,
        usuario_registro: 'ADMIN'
      }

      const { error } = await supabase.from('combustible').insert([payload])
      
      if (error) throw error
      
      alert('✅ Carga de combustible registrada exitosamente')
      setShowNuevo(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      economico: '',
      fecha_carga: new Date().toISOString().split('T')[0],
      litros: '',
      monto_pagado: '',
      precio_por_litro: '',
      estacion_proveedor: '',
      folio_ticket: '',
      notas: ''
    })
    setArchivoTicket(null)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from('combustible').delete().eq('id', id)
    if (error) alert('Error al eliminar')
    else fetchData()
  }

  // Estaciones únicas
  const estacionesUnicas = [...new Set(combustibles.map(c => c.estacion_proveedor).filter(Boolean))]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Fuel className="text-yellow-400" size={40} /> Control de Combustible
        </h1>
        <Button 
          onClick={() => setShowNuevo(true)}
          className="bg-yellow-400 text-black hover:bg-yellow-500 font-black"
        >
          <PlusCircle className="mr-2" size={20} /> NUEVA CARGA
        </Button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Total Cargas</p>
                <p className="text-2xl font-black text-blue-600">{stats.totalCargas}</p>
              </div>
              <Fuel size={32} className="text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Litros Totales</p>
                <p className="text-2xl font-black text-cyan-600">{stats.totalLitros.toLocaleString()}</p>
              </div>
              <Droplet size={32} className="text-cyan-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Total Invertido</p>
                <p className="text-2xl font-black text-green-600">${stats.totalInvertido.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
              <DollarSign size={32} className="text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Con IVA (16%)</p>
                <p className="text-2xl font-black text-emerald-600">${stats.totalConIva.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
              <DollarSign size={32} className="text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Promedio/Litro</p>
                <p className="text-2xl font-black text-purple-600">${stats.promedioPorLitro.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
              <TrendingUp size={32} className="text-purple-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-2">
                <Filter size={14} /> Unidad
              </label>
              <select 
                value={filtroUnidad} 
                onChange={(e) => setFiltroUnidad(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="ALL">Todas</option>
                {unidades.map(u => (
                  <option key={u.economico} value={u.economico}>{u.economico}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-2">
                <Filter size={14} /> Estación
              </label>
              <select 
                value={filtroEstacion} 
                onChange={(e) => setFiltroEstacion(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="ALL">Todas</option>
                {estacionesUnicas.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLA */}
      <Card className="bg-white">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-900 text-white">
                <TableHead className="text-white">FECHA</TableHead>
                <TableHead className="text-white">UNIDAD</TableHead>
                <TableHead className="text-white text-right">LITROS</TableHead>
                <TableHead className="text-white text-right">MONTO</TableHead>
                <TableHead className="text-white text-right">$/L</TableHead>
                <TableHead className="text-white">ESTACIÓN</TableHead>
                <TableHead className="text-white">FOLIO</TableHead>
                <TableHead className="text-white">TICKET</TableHead>
                <TableHead className="text-white">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combustiblesFiltrados.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell className="font-bold">{c.fecha_carga}</TableCell>
                  <TableCell><Badge variant="outline">{c.economico}</Badge></TableCell>
                  <TableCell className="text-right">{c.litros.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">${c.monto_pagado.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                  <TableCell className="text-right">${c.precio_por_litro?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-'}</TableCell>
                  <TableCell className="text-sm">{c.estacion_proveedor || '-'}</TableCell>
                  <TableCell className="text-xs font-mono">{c.folio_ticket || '-'}</TableCell>
                  <TableCell>
                    {c.ticket_url ? (
                      <a href={c.ticket_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        📄 Ver
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin ticket</span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <button onClick={() => setVerDetalle(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEliminar(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: NUEVA CARGA */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-5xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Registrar Nueva Carga de Combustible</DialogTitle>
          </DialogHeader>
          <div className="bg-zinc-900 p-6 text-white border-b-4 border-yellow-400 -m-6 mb-6 rounded-t-2xl">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Fuel className="text-yellow-400" /> Nueva Carga de Combustible
            </h2>
          </div>

          <div className="space-y-6 px-8 pb-6">
            {/* SECCIÓN 1: DATOS BÁSICOS */}
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-sm font-black text-blue-900 uppercase mb-4 flex items-center gap-2">
                <Truck size={18} /> Datos del Viaje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Unidad *</label>
                  <select 
                    value={form.economico} 
                    onChange={(e) => setForm({...form, economico: e.target.value})}
                    className="w-full border-2 rounded-lg px-4 py-3 font-bold bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {unidades.map(u => (
                      <option key={u.economico} value={u.economico}>{u.economico}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Fecha Carga *</label>
                  <Input 
                    type="date" 
                    value={form.fecha_carga}
                    onChange={(e) => setForm({...form, fecha_carga: e.target.value})}
                    className="border-2 rounded-lg h-12 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Estación/Proveedor</label>
                  <Input 
                    placeholder="Pemex, Chevron, etc."
                    value={form.estacion_proveedor}
                    onChange={(e) => setForm({...form, estacion_proveedor: e.target.value.toUpperCase()})}
                    className="border-2 rounded-lg h-12 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: COMBUSTIBLE */}
            <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
              <h3 className="text-sm font-black text-green-900 uppercase mb-4 flex items-center gap-2">
                <Fuel size={18} /> Información de Combustible
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Litros *</label>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    value={form.litros}
                    onChange={(e) => setForm({...form, litros: e.target.value})}
                    className="border-2 rounded-lg h-12 font-bold text-lg bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Monto Pagado *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">$</span>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={form.monto_pagado}
                      onChange={(e) => setForm({...form, monto_pagado: e.target.value})}
                      className="border-2 rounded-lg h-12 font-bold text-lg pl-8 bg-white text-green-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Precio/Litro (auto)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 font-bold">$</span>
                    <Input 
                      type="number" 
                      placeholder="Se calcula automáticamente"
                      value={form.precio_por_litro}
                      onChange={(e) => setForm({...form, precio_por_litro: e.target.value})}
                      className="border-2 rounded-lg h-12 bg-purple-50 pl-8 text-purple-700 font-bold"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DOCUMENTACIÓN */}
            <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
              <h3 className="text-sm font-black text-amber-900 uppercase mb-4 flex items-center gap-2">
                <FileText size={18} /> Documentación y Notas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Folio/Ticket</label>
                  <Input 
                    placeholder="Número de folio"
                    value={form.folio_ticket}
                    onChange={(e) => setForm({...form, folio_ticket: e.target.value.toUpperCase()})}
                    className="border-2 rounded-lg h-12 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Notas</label>
                  <textarea 
                    placeholder="Observaciones adicionales..."
                    value={form.notas}
                    onChange={(e) => setForm({...form, notas: e.target.value})}
                    className="w-full border-2 rounded-lg px-4 py-2 text-sm bg-white"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* CARGA DE TICKET */}
            <div className="border-4 border-dashed border-yellow-400 rounded-xl p-8 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
              <Fuel className="mx-auto mb-3 text-yellow-600" size={48} />
              <h3 className="font-black text-zinc-900 mb-2 text-lg uppercase">Adjuntar Ticket de Combustible</h3>
              <p className="text-sm text-zinc-600 mb-6">PDF, JPG o PNG - Máximo 10 MB</p>
              
              <input 
                type="file" 
                id="ticket-input"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) escanearTicketConIA(file)
                }}
                className="hidden"
              />
              
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  onClick={() => document.getElementById('ticket-input')?.click()}
                  disabled={escaneandoIA}
                  className="bg-purple-600 text-white hover:bg-purple-700 font-black px-8 py-6 text-base"
                  size="lg"
                >
                  {escaneandoIA ? '🔄 ESCANEANDO...' : '🤖 ESCANEAR CON IA'}
                </Button>
                
                <Button 
                  onClick={() => {
                    const input = document.getElementById('ticket-manual') as HTMLInputElement
                    input?.click()
                  }}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 font-black px-8 py-6 text-base"
                  size="lg"
                >
                  📄 SUBIR SIN ESCANEAR
                </Button>
                
                <input 
                  type="file" 
                  id="ticket-manual"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setArchivoTicket(file)
                  }}
                  className="hidden"
                />
              </div>

              {archivoTicket && (
                <div className="mt-4 p-3 bg-green-100 border-2 border-green-400 rounded-lg">
                  <p className="text-sm text-green-800 font-bold">✅ Archivo seleccionado: {archivoTicket.name}</p>
                  <p className="text-xs text-green-600">{(archivoTicket.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t p-6 flex gap-3">
            <Button 
              onClick={() => {
                setShowNuevo(false)
                resetForm()
              }}
              variant="outline"
              className="font-black px-8"
            >
              ❌ CANCELAR
            </Button>
            <Button 
              onClick={handleGuardarCombustible}
              disabled={loading}
              className="bg-green-600 text-white hover:bg-green-700 font-black px-8 flex-1"
            >
              {loading ? '⏳ Guardando...' : '✅ REGISTRAR CARGA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER DETALLE */}
      <Dialog open={!!verDetalle} onOpenChange={() => setVerDetalle(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">
              Detalle de Carga de Combustible
            </DialogTitle>
          </DialogHeader>
          
          {verDetalle && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Unidad:</span> <Badge>{verDetalle.economico}</Badge></div>
                <div><span className="font-bold">Fecha:</span> {verDetalle.fecha_carga}</div>
                <div><span className="font-bold">Litros:</span> {verDetalle.litros.toLocaleString()}</div>
                <div><span className="font-bold">Monto:</span> ${verDetalle.monto_pagado.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                <div><span className="font-bold">Precio/L:</span> ${verDetalle.precio_por_litro?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                <div><span className="font-bold">Estación:</span> {verDetalle.estacion_proveedor || '-'}</div>
                <div><span className="font-bold">Folio:</span> {verDetalle.folio_ticket || '-'}</div>
                <div className="col-span-2 bg-green-50 p-3 rounded-lg">
                  <span className="font-bold">TOTAL CON IVA:</span>
                  <span className="text-2xl font-black text-green-700 ml-2">
                    ${((verDetalle.monto_pagado || 0) * 1.16).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>

              {verDetalle.notas && (
                <div className="border-t pt-4">
                  <span className="font-bold">Notas:</span>
                  <p className="text-sm text-gray-700 mt-2">{verDetalle.notas}</p>
                </div>
              )}

              {verDetalle.ticket_url && (
                <div className="border-t pt-4">
                  <a 
                    href={verDetalle.ticket_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Download size={20} /> VER TICKET
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
