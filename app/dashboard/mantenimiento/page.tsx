"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { 
  Wrench, PlusCircle, AlertTriangle, DollarSign, Calendar, FileText, 
  Upload, Download, Eye, Trash2, CheckCircle2, Clock, TrendingUp, Filter
} from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8' 
const supabase = createClient(supabaseUrl, supabaseKey)

export default function MantenimientoAmel() {
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNuevo, setShowNuevo] = useState(false)
  const [verDetalle, setVerDetalle] = useState<any>(null)
  
  // Filtros
  const [filtroUnidad, setFiltroUnidad] = useState('ALL')
  const [filtroCategoria, setFiltroCategoria] = useState('ALL')
  const [filtroTipo, setFiltroTipo] = useState('ALL')

  // Formulario nuevo mantenimiento
  const [form, setForm] = useState({
    economico: '',
    tipo_unidad: 'TRACTO',
    fecha_servicio: new Date().toISOString().split('T')[0],
    tipo_mantenimiento: 'PREVENTIVO',
    categoria: 'ACEITE Y FILTROS',
    km_actual: '',
    km_proximo_servicio: '',
    descripcion: '',
    sintomas: '',
    diagnostico: '',
    proveedor: '',
    direccion_proveedor: '',
    telefono_proveedor: '',
    folio_ticket: '',
    monto_refacciones: '',
    monto_mano_obra: '',
    monto_otros: '',
    en_garantia: false,
    fecha_fin_garantia: '',
    notas: '',
    requiere_seguimiento: false,
    fecha_seguimiento: ''
  })

  // Estado para archivo de comprobante
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [escaneandoIA, setEscaneandoIA] = useState(false)
  const [partidas, setPartidas] = useState<any[]>([])
  const [detallePiezas, setDetallePiezas] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: m, error: errM } = await supabase.from('mantenimientos').select('*').order('fecha_servicio', { ascending: false })
    const { data: u, error: errU } = await supabase.from('unidades').select('economico, tipo').eq('estatus', 'Activo').order('economico')
    
    if (errM) console.error('Error fetching mantenimientos:', errM)
    if (errU) console.error('Error fetching unidades:', errU)
    
    if (m) setMantenimientos(m)
    if (u) setUnidades(u)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Aplicar filtros
  const mantenimientosFiltrados = mantenimientos.filter(m => {
    if (filtroUnidad !== 'ALL' && m.economico !== filtroUnidad) return false
    if (filtroCategoria !== 'ALL' && m.categoria !== filtroCategoria) return false
    if (filtroTipo !== 'ALL' && m.tipo_mantenimiento !== filtroTipo) return false
    return true
  })

  // Calcular estadísticas
  const stats = {
    totalServicios: mantenimientosFiltrados.length,
    totalAPagar: mantenimientosFiltrados.reduce((sum, m) => sum + ((m.monto_total || 0) * 1.16), 0),
    promedioServicio: mantenimientosFiltrados.length > 0 
      ? mantenimientosFiltrados.reduce((sum, m) => sum + ((m.monto_total || 0) * 1.16), 0) / mantenimientosFiltrados.length 
      : 0,
    pendientes: mantenimientosFiltrados.filter(m => m.estatus === 'PENDIENTE').length
  }

  // Subir comprobante a Supabase Storage
  const subirComprobante = async (file: File, economico: string, fecha: string, folio: string): Promise<string | null> => {
    try {
      const extension = file.name.split('.').pop()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const anio = fecha.split('-')[0]
      const mes = fecha.split('-')[1]
      
      const rutaArchivo = `${anio}/${mes}/${economico}_${timestamp}_${folio || 'SIN_FOLIO'}.${extension}`
      
      const { data, error } = await supabase.storage
        .from('comprobantes-mantenimiento')
        .upload(rutaArchivo, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Obtener URL pública (o signed URL si es privado)
      const { data: urlData } = supabase.storage
        .from('comprobantes-mantenimiento')
        .getPublicUrl(rutaArchivo)
      
      return urlData.publicUrl
    } catch (error: any) {
      console.error('⚠️ Advertencia - No se pudo subir comprobante:', error.message)
      console.log('💡 El registro se guardará sin comprobante. Puedes agregarlo después.')
      // No lanzar error, retornar null para continuar sin archivo
      return null
    }
  }

  const handleGuardarMantenimiento = async () => {
    if (!form.economico || !form.descripcion || !form.proveedor) {
      alert('Completa los campos obligatorios: Unidad, Descripción, Proveedor')
      return
    }

    setLoading(true)
    
    try {
      let comprobanteUrl = null
      
      // Si hay archivo, subirlo primero
      if (archivoComprobante) {
        comprobanteUrl = await subirComprobante(
          archivoComprobante,
          form.economico,
          form.fecha_servicio,
          form.folio_ticket
        )
      }

      // Calcular km_proximo_servicio si no se especificó
      const kmProximo = form.km_proximo_servicio || (Number(form.km_actual) + 25000)
      
      // Calcular monto_total
      const monto_refacciones = Number(form.monto_refacciones) || 0
      const monto_mano_obra = Number(form.monto_mano_obra) || 0
      const monto_otros = Number(form.monto_otros) || 0
      const monto_total = monto_refacciones + monto_mano_obra + monto_otros

      const payload = {
        ...form,
        km_actual: Number(form.km_actual) || 0,
        km_proximo_servicio: Number(kmProximo),
        monto_refacciones: monto_refacciones,
        monto_mano_obra: monto_mano_obra,
        monto_otros: monto_otros,
        monto_total: monto_total,
        comprobante_url: comprobanteUrl,
        comprobante_nombre: archivoComprobante?.name || null,
        comprobante_size: archivoComprobante?.size || null,
        comprobante_tipo: archivoComprobante?.type || null,
        usuario_registro: 'ADMIN', // Cambiar por usuario real
        estatus: 'COMPLETADO',
        // Limpiar fechas vacías a null
        fecha_fin_garantia: form.fecha_fin_garantia ? form.fecha_fin_garantia : null,
        fecha_seguimiento: form.fecha_seguimiento ? form.fecha_seguimiento : null
      }

      const { data: mantenimientoCreado, error } = await supabase
        .from('mantenimientos')
        .insert([payload])
        .select()
        .single()
      
      if (error) throw error

      if (mantenimientoCreado?.id && partidas.length > 0) {
        const piezasPayload = partidas
          .filter((p) => p.descripcion)
          .map((p) => ({
            mantenimiento_id: mantenimientoCreado.id,
            economico: p.economico || form.economico,
            fecha_servicio: form.fecha_servicio,
            pieza: p.descripcion,
            cantidad: Number(p.cantidad) || 1,
            precio_unitario: Number(p.precio_unitario) || 0,
            tipo_mantenimiento: p.tipo_mantenimiento || form.tipo_mantenimiento,
            categoria: p.categoria || form.categoria,
            proveedor: form.proveedor,
            folio_ticket: form.folio_ticket,
            notas: p.notas || null
          }))

        if (piezasPayload.length > 0) {
          const { error: piezasError } = await supabase.from('mantenimiento_piezas').insert(piezasPayload)
          if (piezasError) {
            console.warn('⚠️ Error guardando piezas:', piezasError)
          }
        }
      }
      
      alert('✅ Mantenimiento registrado exitosamente')
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
      tipo_unidad: 'TRACTO',
      fecha_servicio: new Date().toISOString().split('T')[0],
      tipo_mantenimiento: 'PREVENTIVO',
      categoria: 'ACEITE Y FILTROS',
      km_actual: '',
      km_proximo_servicio: '',
      descripcion: '',
      sintomas: '',
      diagnostico: '',
      proveedor: '',
      direccion_proveedor: '',
      telefono_proveedor: '',
      folio_ticket: '',
      monto_refacciones: '',
      monto_mano_obra: '',
      monto_otros: '',
      en_garantia: false,
      fecha_fin_garantia: '',
      notas: '',
      requiere_seguimiento: false,
      fecha_seguimiento: ''
    })
    setPartidas([])
    setArchivoComprobante(null)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro de mantenimiento?')) return
    
    setLoading(true)
    try {
      const { error } = await supabase.from('mantenimientos').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = async (m: any) => {
    setVerDetalle(m)
    setDetallePiezas([])
    try {
      const { data, error } = await supabase
        .from('mantenimiento_piezas')
        .select('*')
        .eq('mantenimiento_id', m.id)
        .order('created_at', { ascending: true })

      if (error) console.error('Error cargando piezas:', error)
      if (data) setDetallePiezas(data)
    } catch (err) {
      console.error('Error cargando piezas:', err)
    }
  }

  const escanearFacturaConIA = async (file: File) => {
    setEscaneandoIA(true)
    try {
      console.log('📸 Iniciando escaneo de archivo:', file.name, file.type)
      const formData = new FormData()
      formData.append('file', file)

      console.log('🌐 Enviando a /api/escanear-factura...')
      const response = await fetch('/api/escanear-factura', {
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
        console.error('❌ Respuesta sin campo "datos":', responseData)
        throw new Error('Respuesta inválida del API: no contiene campo "datos"')
      }

      const { datos } = responseData
      console.log('✅ Datos extraídos:', datos)

      // Autocompletar formulario con los datos extraídos
      setForm(prev => ({
        ...prev,
        proveedor: datos.proveedor || prev.proveedor,
        folio_ticket: datos.folio_ticket || prev.folio_ticket,
        fecha_servicio: datos.fecha_servicio || prev.fecha_servicio,
        telefono_proveedor: datos.telefono_proveedor || prev.telefono_proveedor,
        direccion_proveedor: datos.direccion_proveedor || prev.direccion_proveedor,
        descripcion: datos.descripcion || prev.descripcion,
        sintomas: datos.sintomas || prev.sintomas,
        monto_refacciones: datos.monto_refacciones?.toString() || prev.monto_refacciones,
        monto_mano_obra: datos.monto_mano_obra?.toString() || prev.monto_mano_obra,
        monto_otros: datos.monto_otros?.toString() || prev.monto_otros,
        categoria: datos.categoria || prev.categoria,
        tipo_mantenimiento: datos.tipo_mantenimiento || prev.tipo_mantenimiento,
        notas: datos.notas || prev.notas
      }))

      const partidasDetectadas = Array.isArray(datos.partidas) && datos.partidas.length > 0
        ? datos.partidas
        : (Array.isArray(datos.conceptos) ? datos.conceptos.map((c: string) => ({ descripcion: c })) : [])

      if (partidasDetectadas.length > 0) {
        setPartidas(partidasDetectadas.map((p: any) => ({
          descripcion: p.descripcion || '',
          economico: form.economico,
          cantidad: p.cantidad || 1,
          precio_unitario: p.precio_unitario || p.total || 0,
          tipo_mantenimiento: p.tipo_mantenimiento || datos.tipo_mantenimiento || form.tipo_mantenimiento,
          categoria: p.categoria || datos.categoria || form.categoria,
          notas: p.notas || ''
        })))
      }

      // Guardar el archivo
      setArchivoComprobante(file)

      alert('✅ Factura escaneada exitosamente! Revisa los campos autocompletados.')
    } catch (error: any) {
      console.error('❌ Error escaneando:', error)
      const errorMsg = error.message || 'Error desconocido'
      console.error('Detalles completos:', error)
      alert(`⚠️ El escaneo con IA no está disponible en este momento.\n\nUsa el botón "SUBIR SIN ESCANEAR" para cargar el comprobante y completa el formulario manualmente.\n\nError: ${errorMsg}`)
    } finally {
      setEscaneandoIA(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900 w-full font-sans">
      <div className="max-w-[1800px] mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4 border-yellow-400">
          <div className="flex items-center gap-4">
            <Wrench size={32} className="text-yellow-500" />
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                CONTROL DE <span className="text-yellow-600">MANTENIMIENTO</span>
              </h1>
              <p className="text-xs text-zinc-500">Historial completo con comprobantes digitales</p>
            </div>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowNuevo(true); }} 
            style={{backgroundColor: AMEL_YELLOW, color: '#000'}} 
            className="font-black italic px-6 h-10 shadow-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> NUEVO SERVICIO
          </Button>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-l-4 border-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Total Servicios</p>
                  <p className="text-2xl font-black text-blue-600">{stats.totalServicios}</p>
                </div>
                <Wrench size={32} className="text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Total a Pagar (con IVA)</p>
                  <p className="text-2xl font-black text-green-600">${stats.totalAPagar.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>
                <DollarSign size={32} className="text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Promedio/Servicio (con IVA)</p>
                  <p className="text-2xl font-black text-purple-600">${stats.promedioServicio.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>
                <TrendingUp size={32} className="text-purple-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Pendientes</p>
                  <p className="text-2xl font-black text-orange-600">{stats.pendientes}</p>
                </div>
                <Clock size={32} className="text-orange-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {[...new Set(mantenimientos.map(m => m.economico))].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Categoría</label>
                <select 
                  value={filtroCategoria} 
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ALL">Todas</option>
                  <option value="REFACCIONES">REFACCIONES</option>
                  <option value="FERRETERIA">FERRETERIA</option>
                  <option value="MANO DE OBRA">MANO DE OBRA</option>
                  <option value="VULCANIZADORA">VULCANIZADORA</option>
                  <option value="ACEITE Y FILTROS">ACEITE Y FILTROS</option>
                  <option value="SUSPENSION">SUSPENSIÓN</option>
                  <option value="FRENOS">FRENOS</option>
                  <option value="ELECTRICO">ELÉCTRICO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Tipo</label>
                <select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ALL">Todos</option>
                  <option value="PREVENTIVO">PREVENTIVO</option>
                  <option value="CORRECTIVO">CORRECTIVO</option>
                  <option value="EMERGENCIA">EMERGENCIA</option>
                  <option value="REVISION">REVISIÓN</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => { setFiltroUnidad('ALL'); setFiltroCategoria('ALL'); setFiltroTipo('ALL'); }}
                  variant="outline"
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABLA DE MANTENIMIENTOS */}
        <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-zinc-900 text-white p-4">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <FileText size={18} /> Historial de Servicios
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow className="text-xs font-black uppercase">
                  <TableHead className="text-center">Unidad</TableHead>
                  <TableHead className="text-center">Fecha</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Categoría</TableHead>
                  <TableHead className="text-center">KM</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-center">Monto (con IVA)</TableHead>
                  <TableHead className="text-center">Comprobante</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientosFiltrados.map((m) => (
                  <TableRow key={m.id} className="hover:bg-zinc-50 text-sm">
                    <TableCell className="font-black text-center">{m.economico}</TableCell>
                    <TableCell className="text-center text-zinc-600">{m.fecha_servicio}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        m.tipo_mantenimiento === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' :
                        m.tipo_mantenimiento === 'CORRECTIVO' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {m.tipo_mantenimiento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{m.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{m.km_actual?.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{m.descripcion}</TableCell>
                    <TableCell className="font-semibold">{m.proveedor}</TableCell>
                    <TableCell className="text-center font-black text-green-600">
                      ${((m.monto_total || 0) * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.comprobante_url ? (
                        <a href={m.comprobante_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Eye size={14} className="text-blue-600" />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">Sin archivo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(m)} className="h-8 px-2">
                          <FileText size={14} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEliminar(m.id)} className="h-8 px-2">
                          <Trash2 size={14} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MODAL: NUEVO MANTENIMIENTO */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1200px] bg-white p-0 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Registrar Nuevo Servicio de Mantenimiento</DialogTitle>
          </DialogHeader>
          <div className="bg-zinc-900 p-6 text-white border-b-4 border-yellow-400">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Wrench className="text-yellow-400" /> Registrar Nuevo Servicio
            </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* FILA 1: DATOS BÁSICOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Unidad principal *</label>
                <select 
                  value={form.economico} 
                  onChange={(e) => setForm({...form, economico: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 font-bold"
                >
                  <option value="">Seleccionar...</option>
                  <option value="VARIAS">VARIAS</option>
                  {unidades.map(u => (
                    <option key={u.economico} value={u.economico}>{u.economico}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">Si la factura incluye varias unidades, selecciona VARIAS y asigna por pieza.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Fecha Servicio *</label>
                <Input 
                  type="date" 
                  value={form.fecha_servicio} 
                  onChange={(e) => setForm({...form, fecha_servicio: e.target.value})}
                  className="h-12"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">KM Actual *</label>
                <Input 
                  type="number" 
                  placeholder="145000" 
                  value={form.km_actual}
                  onChange={(e) => setForm({...form, km_actual: e.target.value})}
                  className="h-12 text-lg font-bold"
                />
              </div>
            </div>

            {/* FILA 2: TIPO Y CATEGORÍA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Tipo de Mantenimiento *</label>
                <select 
                  value={form.tipo_mantenimiento}
                  onChange={(e) => setForm({...form, tipo_mantenimiento: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 font-bold"
                >
                  <option value="PREVENTIVO">PREVENTIVO</option>
                  <option value="CORRECTIVO">CORRECTIVO</option>
                  <option value="EMERGENCIA">EMERGENCIA</option>
                  <option value="REVISION">REVISIÓN</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Categoría *</label>
                <select 
                  value={form.categoria}
                  onChange={(e) => setForm({...form, categoria: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 font-bold"
                >
                  <option value="ACEITE Y FILTROS">ACEITE Y FILTROS</option>
                  <option value="REFACCIONES">REFACCIONES</option>
                  <option value="FERRETERIA">FERRETERIA</option>
                  <option value="MANO DE OBRA">MANO DE OBRA</option>
                  <option value="VULCANIZADORA">VULCANIZADORA</option>
                  <option value="SUSPENSION">SUSPENSIÓN</option>
                  <option value="FRENOS">FRENOS</option>
                  <option value="ELECTRICO">ELÉCTRICO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>
            </div>

            {/* FILA 3: DESCRIPCIÓN */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Descripción del Servicio *</label>
              <textarea 
                value={form.descripcion}
                onChange={(e) => setForm({...form, descripcion: e.target.value})}
                placeholder="Ejemplo: Cambio de aceite sintético 15W40, filtro de aceite, filtro de aire, filtro de diesel..."
                className="w-full border-2 rounded-xl px-4 py-3 min-h-[80px] font-medium"
              />
            </div>

            {/* FILA 4: PROVEEDOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Proveedor/Taller *</label>
                <Input 
                  placeholder="TALLER GARCÍA" 
                  value={form.proveedor}
                  onChange={(e) => setForm({...form, proveedor: e.target.value.toUpperCase()})}
                  className="h-12 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Teléfono</label>
                <Input 
                  placeholder="811-234-5678" 
                  value={form.telefono_proveedor}
                  onChange={(e) => setForm({...form, telefono_proveedor: e.target.value})}
                  className="h-12"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Folio Ticket/Factura</label>
                <Input 
                  placeholder="FAC-2026-001234" 
                  value={form.folio_ticket}
                  onChange={(e) => setForm({...form, folio_ticket: e.target.value.toUpperCase()})}
                  className="h-12 font-mono"
                />
              </div>
            </div>

            {/* DETALLE POR PIEZA / SERVICIO */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase">Detalle por pieza/servicio</h3>
                  <p className="text-xs text-zinc-500">Registra cada pieza con su costo con IVA y asigna unidad por pieza</p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 font-bold"
                  onClick={() =>
                    setPartidas([
                      ...partidas,
                      {
                        descripcion: '',
                        economico: form.economico,
                        cantidad: 1,
                        precio_unitario: '',
                        tipo_mantenimiento: form.tipo_mantenimiento,
                        categoria: form.categoria,
                        notas: ''
                      }
                    ])
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Agregar pieza
                </Button>
              </div>

              {partidas.length === 0 ? (
                <div className="text-xs text-zinc-500 italic">Sin partidas registradas</div>
              ) : (
                <div className="space-y-3">
                  {partidas.map((p, idx) => {
                    const cantidad = Number(p.cantidad) || 1
                    const precio = Number(p.precio_unitario) || 0
                    const totalConIva = (cantidad * precio * 1.16).toFixed(2)

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                          <Input
                            placeholder="Pieza / Servicio"
                            value={p.descripcion}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], descripcion: e.target.value }
                              setPartidas(next)
                            }}
                            className="h-10"
                          />
                          <select
                            className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
                            value={p.economico || ''}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], economico: e.target.value }
                              setPartidas(next)
                            }}
                          >
                            <option value="">Unidad (usa principal)</option>
                            <option value="VARIAS">VARIAS</option>
                            {unidades.map(u => (
                              <option key={`${u.economico}-${idx}`} value={u.economico}>{u.economico}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Cant."
                            value={p.cantidad}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], cantidad: e.target.value }
                              setPartidas(next)
                            }}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder="$ Unitario"
                            value={p.precio_unitario}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], precio_unitario: e.target.value }
                              setPartidas(next)
                            }}
                            className="h-10"
                          />
                          <select
                            className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
                            value={p.tipo_mantenimiento}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], tipo_mantenimiento: e.target.value }
                              setPartidas(next)
                            }}
                          >
                            <option value="PREVENTIVO">PREVENTIVO</option>
                            <option value="CORRECTIVO">CORRECTIVO</option>
                            <option value="EMERGENCIA">EMERGENCIA</option>
                            <option value="REVISION">REVISION</option>
                          </select>
                          <select
                            className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
                            value={p.categoria}
                            onChange={(e) => {
                              const next = [...partidas]
                              next[idx] = { ...next[idx], categoria: e.target.value }
                              setPartidas(next)
                            }}
                          >
                            <option value="REFACCIONES">REFACCIONES</option>
                            <option value="FERRETERIA">FERRETERIA</option>
                            <option value="MANO DE OBRA">MANO DE OBRA</option>
                            <option value="VULCANIZADORA">VULCANIZADORA</option>
                            <option value="ACEITE Y FILTROS">ACEITE Y FILTROS</option>
                            <option value="SUSPENSION">SUSPENSION</option>
                            <option value="FRENOS">FRENOS</option>
                            <option value="ELECTRICO">ELECTRICO</option>
                            <option value="OTRO">OTRO</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-bold text-zinc-600">Total con IVA:</span>
                          <span className="text-sm font-black text-zinc-900">${totalConIva}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const next = partidas.filter((_, i) => i !== idx)
                              setPartidas(next)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="text-right text-sm font-bold text-zinc-700">
                    Total piezas (con IVA): $
                    {partidas
                      .reduce((sum, p) => {
                        const cantidad = Number(p.cantidad) || 1
                        const precio = Number(p.precio_unitario) || 0
                        return sum + cantidad * precio * 1.16
                      }, 0)
                      .toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* FILA 5: COSTOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <label className="text-xs font-bold text-blue-700 uppercase mb-2 block">Monto Refacciones</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.monto_refacciones}
                  onChange={(e) => setForm({...form, monto_refacciones: e.target.value})}
                  className="h-12 text-xl font-black text-center border-none bg-white"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <label className="text-xs font-bold text-green-700 uppercase mb-2 block">Monto Mano de Obra</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.monto_mano_obra}
                  onChange={(e) => setForm({...form, monto_mano_obra: e.target.value})}
                  className="h-12 text-xl font-black text-center border-none bg-white"
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <label className="text-xs font-bold text-purple-700 uppercase mb-2 block">Otros Gastos</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.monto_otros}
                  onChange={(e) => setForm({...form, monto_otros: e.target.value})}
                  className="h-12 text-xl font-black text-center border-none bg-white"
                />
              </div>
            </div>

            {/* TOTAL */}
            <div className="bg-zinc-900 text-white p-6 rounded-2xl">
              <p className="text-xs font-bold uppercase mb-2">Total a Pagar (con IVA)</p>
              <p className="text-4xl font-black">
                ${(((Number(form.monto_refacciones) || 0) + (Number(form.monto_mano_obra) || 0) + (Number(form.monto_otros) || 0)) * 1.16).toFixed(2)}
              </p>
            </div>

            {/* UPLOAD COMPROBANTE CON IA */}
            <div className="border-4 border-dashed border-yellow-300 bg-yellow-50 p-8 rounded-2xl text-center">
              <Upload size={48} className="mx-auto text-yellow-600 mb-4" />
              <h3 className="text-lg font-black uppercase mb-2">Adjuntar Comprobante</h3>
              <p className="text-sm text-zinc-600 mb-4">PDF, JPG o PNG - Máximo 10 MB</p>
              
              {/* Botón de escaneo con IA */}
              <div className="mb-4">
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert('El archivo es demasiado grande. Máximo 10 MB.')
                        return
                      }
                      // Automáticamente escanear con IA
                      await escanearFacturaConIA(file)
                    }
                  }}
                  className="hidden"
                  id="upload-ia"
                  disabled={escaneandoIA}
                />
                
                <label 
                  htmlFor="upload-ia"
                  className={`inline-block px-8 py-4 rounded-xl cursor-pointer transition-all font-black text-sm shadow-lg ${
                    escaneandoIA 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  }`}
                >
                  {escaneandoIA ? (
                    <>🔄 ESCANEANDO CON IA...</>
                  ) : (
                    <>🤖 ESCANEAR FACTURA CON IA</>
                  )}
                </label>
                <p className="text-xs text-purple-600 mt-2 font-bold">✨ Completa automáticamente el formulario</p>
              </div>

              {/* Botón de upload manual (alternativo) */}
              <div className="border-t border-yellow-300 pt-4 mt-4">
                <p className="text-xs text-zinc-500 mb-3">O carga el archivo manualmente:</p>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert('El archivo es demasiado grande. Máximo 10 MB.')
                        return
                      }
                      setArchivoComprobante(file)
                    }
                  }}
                  className="hidden"
                  id="upload-comprobante"
                />
                
                <label 
                  htmlFor="upload-comprobante"
                  className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-black px-6 py-3 rounded-xl cursor-pointer transition-colors text-sm"
                >
                  📄 SUBIR SIN ESCANEAR
                </label>
              </div>

              {archivoComprobante && (
                <div className="mt-4 bg-white p-4 rounded-lg border-2 border-green-300">
                  <CheckCircle2 size={24} className="inline text-green-600 mr-2" />
                  <span className="font-bold text-green-700">{archivoComprobante.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">
                    ({(archivoComprobante.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {/* NOTAS */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase mb-2 block">Notas Adicionales</label>
              <textarea 
                value={form.notas}
                onChange={(e) => setForm({...form, notas: e.target.value})}
                placeholder="Observaciones generales..."
                className="w-full border-2 rounded-xl px-4 py-3 min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-50 border-t">
            <Button 
              onClick={handleGuardarMantenimiento}
              disabled={loading}
              style={{backgroundColor: AMEL_YELLOW, color: '#000'}}
              className="w-full h-16 font-black text-xl shadow-xl"
            >
              {loading ? 'GUARDANDO...' : 'REGISTRAR SERVICIO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER DETALLE */}
      <Dialog open={!!verDetalle} onOpenChange={() => { setVerDetalle(null); setDetallePiezas([]) }}>
        <DialogContent className="max-w-3xl bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">
              Detalle del Servicio
            </DialogTitle>
          </DialogHeader>
          
          {verDetalle && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-bold">Unidad:</span> {verDetalle.economico}</div>
                <div><span className="font-bold">Fecha:</span> {verDetalle.fecha_servicio}</div>
                <div><span className="font-bold">KM:</span> {verDetalle.km_actual?.toLocaleString()}</div>
                <div><span className="font-bold">Próximo servicio:</span> {verDetalle.km_proximo_servicio?.toLocaleString()} km</div>
                <div className="col-span-2"><span className="font-bold">Descripción:</span> {verDetalle.descripcion}</div>
                <div className="col-span-2"><span className="font-bold">Proveedor:</span> {verDetalle.proveedor}</div>
                <div><span className="font-bold">Refacciones:</span> ${verDetalle.monto_refacciones?.toLocaleString()}</div>
                <div><span className="font-bold">Mano de Obra:</span> ${verDetalle.monto_mano_obra?.toLocaleString()}</div>
                <div className="col-span-2 bg-green-50 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>SUBTOTAL:</span>
                    <span>
                      ${((verDetalle.monto_total || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>IVA (16%):</span>
                    <span>
                      ${((verDetalle.monto_total || 0) * 0.16).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">TOTAL CON IVA:</span> 
                    <span className="text-2xl font-black text-green-700">
                      ${((verDetalle.monto_total || 0) * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {detallePiezas.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-black uppercase mb-2">Piezas / Servicios</h4>
                  <div className="space-y-2">
                    {detallePiezas.map((p) => (
                      <div key={p.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-zinc-50 p-3 rounded-lg">
                        <div className="text-sm font-bold">{p.pieza}</div>
                        <div className="text-xs text-zinc-500">Unidad: {p.economico || verDetalle.economico}</div>
                        <div className="text-xs text-zinc-600">{p.cantidad} x ${Number(p.precio_unitario || 0).toFixed(2)}</div>
                        <div className="text-xs text-zinc-600">{p.tipo_mantenimiento} · {p.categoria}</div>
                        <div className="text-sm font-black text-zinc-900">${Number(p.total_con_iva || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verDetalle.comprobante_url && (
                <div className="border-t pt-4">
                  <a 
                    href={verDetalle.comprobante_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Download size={20} /> VER COMPROBANTE
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
