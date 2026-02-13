"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { UserCheck, PlusCircle, Edit3, Trash2, Search } from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function PersonalPage() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [filtrados, setFiltrados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [vigenciaFilterContract, setVigenciaFilterContract] = useState<string>('ALL')
  const [vigenciaFilterLicense, setVigenciaFilterLicense] = useState<string>('ALL')
  const [estatusFilter, setEstatusFilter] = useState<string>('ACTIVO')
  const [tipoPersonalFilter, setTipoPersonalFilter] = useState<string>('ALL')
  const [operadorAEditar, setOperadorAEditar] = useState<any>(null)

  const initialFormState = {
    nombre: '', apellido: '', numero_empleado: '', tipo_licencia: '', 
    numero_licencia: '', licencia_vigencia: '', telefono: '', email: '',
    estatus: 'Activo', documento_numero: '', fecha_contratacion: '',
    vigencia_contrato: '', notas: '', tipo_personal: '', salario: '',
    seguro_social: false, infonavit: false, empresa_seguro: '', maneja: false
  }

  const [form, setForm] = useState(initialFormState)

  const fetchOperadores = async () => {
    try {
      const { data, error } = await supabase.from('operadores').select('*').order('nombre', { ascending: true })
      if (error) throw error
      if (data) {
        setOperadores(data)
        setFiltrados(data)
      }
    } catch (error: any) {
      alert(error.message)
    }
  }

  const getVigenciaStatus = (dateStr: any) => {
    if (!dateStr) return { label: 'Sin Vigencia', color: 'bg-zinc-100 text-zinc-700', diff: null }
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Vencido', color: 'bg-red-100 text-red-800', diff }
    if (diff <= 15) return { label: `${diff}d`, color: 'bg-amber-50 text-amber-800', diff }
    return { label: `${diff}d`, color: 'bg-green-100 text-green-800', diff }
  }

  useEffect(() => {
    fetchOperadores()
  }, [])

  useEffect(() => {
    const s = searchTerm.toUpperCase()
    const filtered = operadores.filter((op) => {
      const matchesSearch = op.nombre.toUpperCase().includes(s) ||
        op.apellido.toUpperCase().includes(s) ||
        (op.numero_empleado || '').toUpperCase().includes(s) ||
        (op.telefono || '').includes(searchTerm)
      if (!matchesSearch) return false

      const statusValue = (op.estatus || '').toUpperCase()
      if (estatusFilter !== 'ALL' && statusValue !== estatusFilter) return false

      const tipoValue = (op.tipo_personal || '').toUpperCase()
      if (tipoPersonalFilter !== 'ALL' && tipoValue !== tipoPersonalFilter) return false

      // If both filters are ALL, include by default
      if (vigenciaFilterContract === 'ALL' && vigenciaFilterLicense === 'ALL') return true

      let contractOk = true
      let licenseOk = true

      if (vigenciaFilterContract !== 'ALL') {
        const vsC = getVigenciaStatus(op.vigencia_contrato)
        if (vigenciaFilterContract === 'VENCIDO') contractOk = vsC.diff !== null && vsC.diff < 0
        if (vigenciaFilterContract === 'POR_VENCER') contractOk = vsC.diff !== null && vsC.diff >= 0 && vsC.diff <= 15
        if (vigenciaFilterContract === 'VIGENTE') contractOk = vsC.diff !== null && vsC.diff > 15
      }

      if (vigenciaFilterLicense !== 'ALL') {
        const vsL = getVigenciaStatus(op.licencia_vigencia)
        if (vigenciaFilterLicense === 'VENCIDO') licenseOk = vsL.diff !== null && vsL.diff < 0
        if (vigenciaFilterLicense === 'POR_VENCER') licenseOk = vsL.diff !== null && vsL.diff >= 0 && vsL.diff <= 15
        if (vigenciaFilterLicense === 'VIGENTE') licenseOk = vsL.diff !== null && vsL.diff > 15
      }

      return contractOk && licenseOk
    })
    setFiltrados(filtered)
  }, [searchTerm, operadores, vigenciaFilterContract, vigenciaFilterLicense, estatusFilter, tipoPersonalFilter])

  const handleSave = async () => {
    if (!form.nombre || !form.apellido) {
      alert("Nombre y Apellido son obligatorios")
      return
    }
    setLoading(true)
    try {
      // Limpiar campos vacíos convirtiéndolos a null
      const cleanedForm = {
        ...form,
        documento_numero: form.documento_numero?.trim() || null,
        numero_empleado: form.numero_empleado?.trim() || null,
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        vigencia_contrato: form.vigencia_contrato || null,
        fecha_contratacion: form.fecha_contratacion || null,
        tipo_personal: form.tipo_personal || null,
        // Evitar violar el CHECK de tipo_licencia en personal no operador
        tipo_licencia: form.tipo_personal === 'Operador(a)' ? (form.tipo_licencia || null) : null,
        numero_licencia: form.tipo_personal === 'Operador(a)' ? (form.numero_licencia?.trim() || null) : null,
        licencia_vigencia: form.tipo_personal === 'Operador(a)' ? (form.licencia_vigencia || null) : null,
        salario: form.salario ? parseFloat(form.salario) : null,
        empresa_seguro: form.empresa_seguro?.trim() || null,
        // Solo guardar campos según tipo de personal
        seguro_social: form.tipo_personal === 'Operador(a)' ? form.seguro_social : false,
        infonavit: form.tipo_personal === 'Operador(a)' ? form.infonavit : false,
        maneja: form.tipo_personal !== 'Operador(a)' ? form.maneja : false,
      }
      
      if (operadorAEditar?.id) {
        const { error } = await supabase.from('operadores').update(cleanedForm).eq('id', operadorAEditar.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('operadores').insert([cleanedForm])
        if (error) throw error
      }
      setShowNew(false)
      setOperadorAEditar(null)
      setForm(initialFormState)
      fetchOperadores()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este operador?")) return
    setLoading(true)
    try {
      const { error } = await supabase.from('operadores').delete().eq('id', id)
      if (error) throw error
      fetchOperadores()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (operador: any) => {
    setOperadorAEditar(operador)
    setForm(operador)
    setShowNew(true)
  }

  const closeDialog = () => {
    setShowNew(false)
    setOperadorAEditar(null)
    setForm(initialFormState)
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-2 md:p-4 text-zinc-900 w-full font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4 border-blue-500">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Personal AMEL</h1>
          </div>
          <Button onClick={() => { setForm(initialFormState); setOperadorAEditar(null); setShowNew(true); }} style={{backgroundColor: AMEL_YELLOW, color: '#000'}} className="font-black italic px-6 h-10 shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" /> NUEVO PERSONAL
          </Button>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-4 py-2 border border-zinc-200 flex-1 mr-4">
              <Search size={18} className="text-zinc-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, apellido, empleado o teléfono..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-semibold"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Tipo:</label>
                <select value={tipoPersonalFilter} onChange={(e) => setTipoPersonalFilter(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm">
                  <option value="ALL">Todos</option>
                  <option value="OPERADOR(A)">Operador(a)</option>
                  <option value="CONTADOR(A)">Contador(a)</option>
                  <option value="AUXILIAR CONTABLE">Auxiliar Contable</option>
                  <option value="MONITOREO">Monitoreo</option>
                  <option value="SUPERVISOR(A) DE TRÁFICO REGIONAL">Supervisor(a) de tráfico regional</option>
                  <option value="GERENTE DE TRAFICO">Gerente de trafico</option>
                  <option value="MANTENIMIENTO M1">Mantenimiento M1</option>
                  <option value="MANTENIMIENTO M2">Mantenimiento M2</option>
                  <option value="MANTENIMIENTO M3">Mantenimiento M3</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Estatus:</label>
                <select value={estatusFilter} onChange={(e) => setEstatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm">
                  <option value="ACTIVO">Activos</option>
                  <option value="INACTIVO">Inactivos</option>
                  <option value="SUSPENDIDO">Suspendidos</option>
                  <option value="ALL">Todos</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Contrato:</label>
                <select value={vigenciaFilterContract} onChange={(e) => setVigenciaFilterContract(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm">
                  <option value="ALL">Todos</option>
                  <option value="VIGENTE">Vigentes (&gt;15d)</option>
                  <option value="POR_VENCER">Por vencer (≤15d)</option>
                  <option value="VENCIDO">Vencidos</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Licencia:</label>
                <select value={vigenciaFilterLicense} onChange={(e) => setVigenciaFilterLicense(e.target.value)} className="border rounded-lg px-3 py-2 h-10 font-semibold bg-white text-sm">
                  <option value="ALL">Todos</option>
                  <option value="VIGENTE">Vigentes (&gt;15d)</option>
                  <option value="POR_VENCER">Por vencer (≤15d)</option>
                  <option value="VENCIDO">Vencidos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <Card className="border-none shadow-2xl bg-white rounded-2xl overflow-hidden">
          <div className="p-4 bg-zinc-900 text-white flex items-center justify-between border-b-2 border-blue-500">
            <h3 className="font-black uppercase italic text-sm tracking-widest">Listado de Personal ({filtrados.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-zinc-50 border-b font-black text-xs uppercase text-zinc-600">
                <TableRow className="h-12">
                  <TableHead className="text-left px-4">Nombre</TableHead>
                  <TableHead className="text-left px-4">Apellido</TableHead>
                  <TableHead className="text-left px-4">Tipo Personal</TableHead>
                  <TableHead className="text-left px-4">Salario</TableHead>
                  <TableHead className="text-left px-4">Empleado</TableHead>
                  <TableHead className="text-left px-4">Licencia</TableHead>
                  <TableHead className="text-left px-4">Vigencia Lic.</TableHead>
                  <TableHead className="text-left px-4">Teléfono</TableHead>
                  <TableHead className="text-center px-4">IMSS</TableHead>
                  <TableHead className="text-center px-4">INFONAVIT</TableHead>
                  <TableHead className="text-center px-4">Status</TableHead>
                  <TableHead className="text-center px-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((operador) => (
                  <TableRow key={operador.id} className="border-b hover:bg-zinc-50 transition-colors">
                    <TableCell className="px-4 py-3 font-bold text-sm">{operador.nombre}</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-sm">{operador.apellido}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-600">{operador.tipo_personal || '---'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-green-600">{operador.salario ? `$${parseFloat(operador.salario).toFixed(2)}` : '---'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-600">{operador.numero_empleado || '---'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-600">{operador.numero_licencia || '---'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-600">{operador.licencia_vigencia ? new Date(operador.licencia_vigencia).toLocaleDateString() : '---'}</span>
                        {operador.licencia_vigencia ? (() => { const vsL = getVigenciaStatus(operador.licencia_vigencia); return (<span className={`${vsL.color} px-2 py-1 rounded-full font-bold text-[11px]`}>{vsL.label === 'Vencido' ? 'Vencido' : vsL.label}</span>); })() : <span className="text-zinc-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-600">{operador.telefono || '---'}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge className={operador.seguro_social ? "bg-green-100 text-green-800 font-bold text-[10px]" : "bg-red-100 text-red-800 font-bold text-[10px]"}>
                        {operador.seguro_social ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge className={operador.infonavit ? "bg-green-100 text-green-800 font-bold text-[10px]" : "bg-red-100 text-red-800 font-bold text-[10px]"}>
                        {operador.infonavit ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge className={operador.estatus === 'Activo' ? 
                        "bg-green-100 text-green-800 font-bold uppercase text-[10px]" :
                        "bg-red-100 text-red-800 font-bold uppercase text-[10px]"}>
                        {operador.estatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(operador)} className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                          <Edit3 size={16} className="text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(operador.id)} className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={showNew} onOpenChange={closeDialog}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-none">
          <div className="bg-blue-600 p-4 text-white flex items-center gap-2 border-b-4 border-blue-700">
            <UserCheck size={28} className="text-blue-200" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              {operadorAEditar ? 'Editar Personal' : 'Nuevo Personal'}
            </h2>
          </div>
          
          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            {/* FILA 1: DATOS PERSONALES */}
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">📋 Datos Personales</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase mb-1 block">Nombre *</label>
                  <Input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value.toUpperCase()})} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase mb-1 block">Apellido *</label>
                  <Input placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value.toUpperCase()})} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase mb-1 block">Documento</label>
                  <Input placeholder="Cédula/Pasaporte" value={form.documento_numero} onChange={(e) => setForm({...form, documento_numero: e.target.value})} className="h-9" />
                </div>
              </div>
            </div>

            {/* FILA 2: DATOS LABORALES */}
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">🏢 Datos Laborales</h3>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Tipo de Personal *</label>
                  <select className="w-full border-2 rounded-lg px-3 py-2 h-11 font-semibold bg-zinc-50 text-sm" value={form.tipo_personal} onChange={(e) => setForm({...form, tipo_personal: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    <option value="Operador(a)">Operador(a)</option>
                    <option value="Contador(a)">Contador(a)</option>
                    <option value="Auxiliar Contable">Auxiliar Contable</option>
                    <option value="Monitoreo">Monitoreo</option>
                    <option value="Supervisor(a) de tráfico regional">Supervisor(a) de tráfico regional</option>
                    <option value="Gerente de trafico">Gerente de trafico</option>
                    <option value="Mantenimiento M1">Mantenimiento M1</option>
                    <option value="Mantenimiento M2">Mantenimiento M2</option>
                    <option value="Mantenimiento M3">Mantenimiento M3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Salario Mensual</label>
                  <Input type="number" step="0.01" placeholder="Ej: 15000.00" value={form.salario} onChange={(e) => setForm({...form, salario: e.target.value})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Número Empleado</label>
                  <Input placeholder="Ej: EMP001" value={form.numero_empleado} onChange={(e) => setForm({...form, numero_empleado: e.target.value.toUpperCase()})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Fecha Contratación</label>
                  <Input type="date" value={form.fecha_contratacion} onChange={(e) => setForm({...form, fecha_contratacion: e.target.value})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Vigencia Contrato</label>
                  <Input type="date" value={form.vigencia_contrato} onChange={(e) => setForm({...form, vigencia_contrato: e.target.value})} className="h-11" />
                </div>
              </div>
            </div>

            {/* FILA 2B: SEGURIDAD SOCIAL Y PRESTACIONES */}
            <div>
              {form.tipo_personal === 'Operador(a)' ? (
                <>
                  <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">🏥 Seguridad Social y Prestaciones</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border-2 border-zinc-200">
                      <input 
                        type="checkbox" 
                        id="seguro_social" 
                        checked={form.seguro_social} 
                        onChange={(e) => setForm({...form, seguro_social: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="seguro_social" className="text-xs font-bold text-zinc-700 uppercase cursor-pointer">IMSS (Seguro Social)</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border-2 border-zinc-200">
                      <input 
                        type="checkbox" 
                        id="infonavit" 
                        checked={form.infonavit} 
                        onChange={(e) => setForm({...form, infonavit: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="infonavit" className="text-xs font-bold text-zinc-700 uppercase cursor-pointer">INFONAVIT</label>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Empresa Seguro Social</label>
                      <Input 
                        placeholder="Empresa donde está dado de alta" 
                        value={form.empresa_seguro} 
                        onChange={(e) => setForm({...form, empresa_seguro: e.target.value})}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Status</label>
                      <select className="w-full border-2 rounded-lg px-3 py-2 h-11 font-semibold bg-zinc-50 text-sm" value={form.estatus} onChange={(e) => setForm({...form, estatus: e.target.value})}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">🚗 Información Adicional</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border-2 border-zinc-200">
                      <input 
                        type="checkbox" 
                        id="maneja" 
                        checked={form.maneja} 
                        onChange={(e) => setForm({...form, maneja: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="maneja" className="text-xs font-bold text-zinc-700 uppercase cursor-pointer">Maneja</label>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Empresa Seguro Social</label>
                      <Input 
                        placeholder="Empresa donde está dado de alta" 
                        value={form.empresa_seguro} 
                        onChange={(e) => setForm({...form, empresa_seguro: e.target.value})}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Status</label>
                      <select className="w-full border-2 rounded-lg px-3 py-2 h-11 font-semibold bg-zinc-50 text-sm" value={form.estatus} onChange={(e) => setForm({...form, estatus: e.target.value})}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FILA 3: LICENCIA - SOLO PARA OPERADORES */}
            {form.tipo_personal === 'Operador(a)' && (
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">🚗 Información de Licencia</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Tipo de Licencia</label>
                  <select className="w-full border-2 rounded-lg px-3 py-2 h-11 font-semibold bg-zinc-50 text-sm" value={form.tipo_licencia} onChange={(e) => setForm({...form, tipo_licencia: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    <option value="A - SCT">A - SCT: Autotransporte federal de pasajeros, turismo y servicio privado</option>
                    <option value="B - SCT">B - SCT: Carga general federal y privada (tractocamiones sencillos)</option>
                    <option value="C - SCT">C - SCT: Carga general en camiones rígidos (tortón o rabón)</option>
                    <option value="D - SCT">D - SCT: Chofer-guía de turistas en turismo federal</option>
                    <option value="E - SCT">E - SCT: Carga especializada, materiales peligrosos y doble articulado (full)</option>
                    <option value="F - SCT">F - SCT: Pasaje y turismo de/hacia puertos marítimos y aeropuertos federales</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Número de Licencia</label>
                  <Input placeholder="Licencia" value={form.numero_licencia} onChange={(e) => setForm({...form, numero_licencia: e.target.value.toUpperCase()})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Vigencia Licencia</label>
                  <Input type="date" value={form.licencia_vigencia} onChange={(e) => setForm({...form, licencia_vigencia: e.target.value})} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase mb-2 block">Teléfono</label>
                  <Input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="h-11" />
                </div>
              </div>
            </div>
            )}

            {/* FILA 4: NOTAS */}
            <div>
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2 pb-1 border-b-2 border-blue-200">📝 Notas Adicionales</h3>
              <textarea 
                placeholder="Notas adicionales..." 
                className="w-full border-2 rounded-lg px-3 py-2 font-semibold bg-zinc-50 min-h-[60px] resize-none text-sm"
                value={form.notas}
                onChange={(e) => setForm({...form, notas: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-200 flex justify-between gap-3">
            <Button variant="outline" className="h-12 px-10 font-black text-base border-2 border-blue-300 hover:bg-blue-50" onClick={closeDialog}>CANCELAR</Button>
            <Button className="h-12 px-10 font-black text-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg" onClick={handleSave} disabled={loading}>
              {loading ? 'GUARDANDO...' : 'GUARDAR PERSONAL'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
