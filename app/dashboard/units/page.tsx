"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Truck, Search, Save, Loader2, FileUp, Sparkles, CheckCircle2, ShieldCheck, PlusCircle, Trash2, Eye, EyeOff } from "lucide-react"
import { extraerFechaDesdePDF } from "@/app/actions/extract-dates"
import { calcularEstadoAmbiental, calcularEstadoFisicoMecanica, obtenerInfoPlaca } from "@/lib/utils-verificacion"

// --- CONFIGURACIÓN ---
const AMEL_YELLOW = "#FFDE18" 
const supabaseUrl = 'https://hgkzcdmagdtjgxaniswr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8' 
const supabase = createClient(supabaseUrl, supabaseKey)

export default function InventarioUnidades() {
  const [unidades, setUnidades] = useState<any[]>([])
  const [filtro, setFiltro] = useState("")
  const [verInactivos, setVerInactivos] = useState(false) // Estado para el filtro visual
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [unidadEditando, setUnidadEditando] = useState<any>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [nuevaUnidad, setNuevaUnidad] = useState({
    economico: '', placas: '', serie_vin: '', sede: 'TIJUANA', estatus: 'Activo'
  })

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('*').order('economico')
    if (data) setUnidades(data)
  }

  useEffect(() => { fetchUnidades() }, [])

  const handleCreateUnit = async () => {
    if (!nuevaUnidad.economico || !nuevaUnidad.placas) return alert("Económico y Placas son obligatorios")
    setLoading(true)
    const { error } = await supabase.from('unidades').insert([nuevaUnidad])
    if (!error) {
      setShowNewModal(false)
      setNuevaUnidad({ economico: '', placas: '', serie_vin: '', sede: 'TIJUANA', estatus: 'Activo' })
      fetchUnidades()
    } else alert(error.message)
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!unidadEditando) return
    setLoading(true)
    await supabase.from('unidades').update({
      serie_vin: unidadEditando.serie_vin,
      placas: unidadEditando.placas,
      estatus: unidadEditando.estatus, // Guardamos el nuevo estatus
      poliza_seguro_vigencia: unidadEditando.poliza_seguro_vigencia || null,
      verificacion_fisico_mecanica: unidadEditando.verificacion_fisico_mecanica || null,
      verificacion_contaminantes: unidadEditando.verificacion_contaminantes || null,
    }).eq('id', unidadEditando.id)
    fetchUnidades()
    setUnidadEditando(null)
    setLoading(false)
  }

  const handleFileUpload = async (e: any, campoUrl: string, eco: string) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(campoUrl)
    const name = `${eco}_${campoUrl}_${Date.now()}.pdf`
    await supabase.storage.from('documentos_unidades').upload(name, file)
    const { data: { publicUrl } } = supabase.storage.from('documentos_unidades').getPublicUrl(name)
    setUnidadEditando({ ...unidadEditando, [campoUrl]: publicUrl })
    await supabase.from('unidades').update({ [campoUrl]: publicUrl }).eq('economico', eco)
    fetchUnidades()
    setUploading(null)
  }

  const obtenerDiasSeguro = (fecha: string) => {
    if (!fecha) return { texto: "SIN PÓLIZA", color: "text-zinc-400" }
    const dias = Math.ceil((new Date(fecha).getTime() - new Date().getTime()) / 86400000)
    if (dias < 0) return { texto: `VENCIDO (${Math.abs(dias)}d)`, color: "text-red-600 font-bold" }
    if (dias <= 15) return { texto: `VENCE EN ${dias}d`, color: "text-orange-600 font-bold animate-pulse" }
    return { texto: `${dias} DÍAS VIGENTES`, color: "text-green-600 font-medium" }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">AMEL <span style={{ color: AMEL_YELLOW }}>FLOTA</span></h1>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            {/* BOTÓN FILTRO ESTADO */}
            <Button 
              variant="outline" 
              className={`font-bold transition-all ${verInactivos ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white'}`}
              onClick={() => setVerInactivos(!verInactivos)}
            >
              {verInactivos ? <Eye className="mr-2 h-4 w-4"/> : <EyeOff className="mr-2 h-4 w-4"/>}
              {verInactivos ? "MOSTRAR ACTIVOS" : "VER INACTIVOS"}
            </Button>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input placeholder="Buscar unidad..." className="pl-10 shadow-sm bg-white" onChange={(e) => setFiltro(e.target.value)} />
            </div>

            <Button onClick={() => setShowNewModal(true)} className="font-black bg-zinc-900 text-white hover:bg-zinc-800">
              <PlusCircle className="mr-2 h-4 w-4" /> REGISTRAR
            </Button>
          </div>
        </div>

        {/* GRID DE UNIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {unidades
            .filter(u => {
              const matchesSearch = u.economico?.toLowerCase().includes(filtro.toLowerCase());
              const matchesStatus = verInactivos ? u.estatus === 'Inactivo' : u.estatus === 'Activo';
              return matchesSearch && matchesStatus;
            })
            .map((unidad) => {
              const estEmi = calcularEstadoAmbiental(unidad.placas, unidad.verificacion_contaminantes)
              const estFM = calcularEstadoFisicoMecanica(unidad.placas, unidad.verificacion_fisico_mecanica)
              const statusSeg = obtenerDiasSeguro(unidad.poliza_seguro_vigencia)

              return (
                <Dialog key={unidad.id}>
                  <DialogTrigger asChild>
                    <Card className={`bg-white hover:shadow-xl cursor-pointer border-t-4 transition-all ${unidad.estatus === 'Inactivo' ? 'opacity-60 grayscale' : ''}`} 
                          style={{ borderTopColor: AMEL_YELLOW }} onClick={() => setUnidadEditando({...unidad})}>
                      <CardHeader className="p-4 flex flex-row justify-between items-start">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tighter">{unidad.economico}</CardTitle>
                        <Badge variant={unidad.estatus === 'Activo' ? 'default' : 'secondary'} className="text-[8px]">
                          {unidad.estatus.toUpperCase()}
                        </Badge>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <div className="border-b pb-2">
                          <p className={`text-[10px] ${statusSeg.color}`}>{statusSeg.texto}</p>
                        </div>
                        <div className="space-y-2 text-[9px] font-black">
                          <div className={`flex justify-between p-2 rounded border ${estFM.color}`}>
                            <span>FÍSICO-MECÁNICA</span><span>{estFM.texto}</span>
                          </div>
                          {unidad.economico.includes("TRA") && (
                            <div className={`flex justify-between p-2 rounded border ${estEmi.color}`}>
                              <span>AMBIENTAL</span><span>{estEmi.texto}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="bg-white max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-2"><DialogTitle className="font-black uppercase italic">Unidad {unidadEditando?.economico}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* SELECTOR DE ESTATUS */}
                      <div className="flex items-center justify-between p-3 bg-zinc-100 rounded-lg">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Estado Operativo</span>
                        <select 
                          className="text-xs font-bold p-1 rounded border bg-white"
                          value={unidadEditando?.estatus || 'Activo'}
                          onChange={(e) => setUnidadEditando({...unidadEditando, estatus: e.target.value})}
                        >
                          <option value="Activo">ACTIVO</option>
                          <option value="Inactivo">INACTIVO / BAJA</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="VIN" value={unidadEditando?.serie_vin || ''} onChange={(e) => setUnidadEditando({...unidadEditando, serie_vin: e.target.value})} />
                        <Input placeholder="Placas" value={unidadEditando?.placas || ''} onChange={(e) => setUnidadEditando({...unidadEditando, placas: e.target.value})} />
                      </div>

                      {[
                        { label: 'Seguro', url: 'url_poliza_seguro', fecha: 'poliza_seguro_vigencia' },
                        { label: 'Físico-Mecánica', url: 'url_verificacion_fm', fecha: 'verificacion_fisico_mecanica' },
                        { label: 'No Contaminantes', url: 'url_verificacion_gas', fecha: 'verificacion_contaminantes', traOnly: true }
                      ].map((doc) => (
                        (!doc.traOnly || unidadEditando?.economico?.includes("TRA")) && (
                          <div key={doc.url} className="p-3 bg-zinc-50 rounded-lg border space-y-2 text-zinc-900">
                            <div className="flex justify-between items-center font-black">
                              <label className="text-[10px] text-zinc-500 uppercase">{doc.label}</label>
                              <Button variant="ghost" size="sm" onClick={() => handleAIProcessing(doc.url, doc.fecha)} disabled={isProcessing}><Sparkles className="h-3 w-3 mr-1 text-blue-600"/> IA SCAN</Button>
                            </div>
                            <div className="flex gap-2">
                              <Input type="date" value={unidadEditando?.[doc.fecha] || ''} onChange={(e) => setUnidadEditando({...unidadEditando, [doc.fecha]: e.target.value})} />
                              <div className="relative">
                                <input type="file" id={doc.url} className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, doc.url, unidadEditando.economico)} />
                                <Button variant="outline" asChild><label htmlFor={doc.url} className="cursor-pointer">{uploading === doc.url ? <Loader2 className="animate-spin h-4 w-4"/> : <FileUp className="h-4 w-4"/>}</label></Button>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                    <DialogFooter className="border-t pt-4">
                      <Button className="w-full font-black h-12" style={{backgroundColor: AMEL_YELLOW}} onClick={handleUpdate} disabled={loading}>GUARDAR CAMBIOS</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )
            })}
        </div>

        {/* MODAL PARA NUEVA UNIDAD */}
        <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle className="font-black uppercase">Nueva Unidad</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4 text-zinc-900">
              <Input placeholder="ECONÓMICO" value={nuevaUnidad.economico} onChange={(e) => setNuevaUnidad({...nuevaUnidad, economico: e.target.value.toUpperCase()})} />
              <Input placeholder="PLACAS" value={nuevaUnidad.placas} onChange={(e) => setNuevaUnidad({...nuevaUnidad, placas: e.target.value.toUpperCase()})} />
              <Input placeholder="SERIE VIN" value={nuevaUnidad.serie_vin} onChange={(e) => setNuevaUnidad({...nuevaUnidad, serie_vin: e.target.value.toUpperCase()})} />
            </div>
            <DialogFooter><Button className="w-full font-bold h-12" style={{backgroundColor: AMEL_YELLOW}} onClick={handleCreateUnit} disabled={loading}>DAR DE ALTA</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}