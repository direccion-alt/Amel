"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Box, FileUp, PlusCircle, ClipboardList, Trash2, FileText } from "lucide-react"

const AMEL_YELLOW = "#FFDE18"
const supabaseUrl = "https://hgkzcdmagdtjgxaniswr.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3pjZG1hZ2R0amd4YW5pc3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIwNjIsImV4cCI6MjA4MzQxODA2Mn0.YnZqt27VbQxxE0UqNj3RJrPJoco-xzU7e6ovWKYR5A8"
const supabase = createClient(supabaseUrl, supabaseKey)

const parseMoney = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

const getCompraTotal = (subtotal: any, iva: any, total: any) => {
  const subtotalValue = parseMoney(subtotal)
  const ivaValue = parseMoney(iva)
  if (subtotalValue !== null || ivaValue !== null) {
    return (subtotalValue || 0) + (ivaValue || 0)
  }
  return parseMoney(total)
}

const getItemTotal = (subtotal: any, iva: any, total: any) => {
  const subtotalValue = parseMoney(subtotal)
  const ivaValue = parseMoney(iva)
  if (subtotalValue !== null || ivaValue !== null) {
    return (subtotalValue || 0) + (ivaValue || 0)
  }
  return parseMoney(total)
}

const movimientoOptions = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SALIDA", label: "Salida" },
  { value: "DEVOLUCION", label: "Devolucion" },
  { value: "TRASLADO", label: "Traslado" },
  { value: "AJUSTE", label: "Ajuste" },
]

export default function ActivosPage() {
  const [activos, setActivos] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingFactura, setUploadingFactura] = useState(false)
  const [uploadingFacturaCompra, setUploadingFacturaCompra] = useState(false)
  const [filtro, setFiltro] = useState("")

  const [showNuevo, setShowNuevo] = useState(false)
  const [showNuevaFactura, setShowNuevaFactura] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [showDetalle, setShowDetalle] = useState(false)
  const [activoSeleccionado, setActivoSeleccionado] = useState<any>(null)

  const [archivoResponsiva, setArchivoResponsiva] = useState<File | null>(null)

  const [formActivo, setFormActivo] = useState({
    nombre: "",
    categoria: "",
    cantidad_total: "",
    ubicacion_actual: "",
    compra_subtotal: "",
    compra_iva: "",
    compra_total: "",
    proveedor_compra: "",
    fecha_compra: "",
    factura_url: "",
    compra_descripcion: "",
  })

  const [facturaForm, setFacturaForm] = useState({
    proveedor: "",
    telefono_proveedor: "",
    fecha_compra: new Date().toISOString().split("T")[0],
    subtotal: "",
    iva: "",
    total: "",
    factura_url: "",
  })

  const [facturaItems, setFacturaItems] = useState<any[]>([])

  const [formMovimiento, setFormMovimiento] = useState({
    tipo_movimiento: "ENTRADA",
    cantidad: "",
    responsable_id: "",
    unidad_id: "",
    ubicacion: "",
    fecha_movimiento: new Date().toISOString().split("T")[0],
    notas: "",
  })

  const fetchData = async () => {
    setLoading(true)
    const { data: a } = await supabase.from("activos").select("*").order("nombre")
    const { data: p } = await supabase.from("operadores").select("id, nombre, apellido, estatus").order("nombre")
    const { data: u } = await supabase.from("unidades").select("id, economico, estatus").order("economico")
    const { data: f } = await supabase.from("facturas_activos").select("*").order("fecha_compra", { ascending: false })
    if (a) setActivos(a)
    if (p) setPersonal(p)
    if (u) setUnidades(u)
    if (f) setFacturas(f)
    setLoading(false)
  }

  const fetchMovimientos = async (activoId: string) => {
    const { data } = await supabase
      .from("movimientos_activos")
      .select("*")
      .eq("activo_id", activoId)
      .order("fecha_movimiento", { ascending: false })
    if (data) setMovimientos(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const personalById = useMemo(() => {
    const map = new Map<string, string>()
    personal.forEach((p) => {
      map.set(p.id, `${p.nombre || ""} ${p.apellido || ""}`.trim())
    })
    return map
  }, [personal])

  const unidadesById = useMemo(() => {
    const map = new Map<string, string>()
    unidades.forEach((u) => {
      map.set(u.id, u.economico)
    })
    return map
  }, [unidades])

  const activosFiltrados = useMemo(() => {
    const s = filtro.toLowerCase()
    return activos.filter((a) => a.nombre?.toLowerCase().includes(s) || a.categoria?.toLowerCase().includes(s))
  }, [activos, filtro])

  const subirResponsiva = async (file: File, activoId: string) => {
    const ext = file.name.split(".").pop()
    const name = `${activoId}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("responsivas-activos").upload(name, file)
    if (error) throw error
    const { data: urlData } = supabase.storage.from("responsivas-activos").getPublicUrl(name)
    return urlData.publicUrl
  }

  const handleFacturaActivoUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFactura(true)
    const name = `activo_${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage.from("facturas-activos").upload(name, file)
    if (uploadError) {
      setUploadingFactura(false)
      return alert(uploadError.message)
    }

    const { data: urlData } = supabase.storage.from("facturas-activos").getPublicUrl(name)
    const facturaUrl = urlData.publicUrl

    setFormActivo((prev) => ({ ...prev, factura_url: facturaUrl }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/escanear-factura-activo", { method: "POST", body: formData })
      const data = await response.json()
      if (response.ok) {
        const firstItem = Array.isArray(data.items) && data.items.length > 0 ? data.items[0] : null
        setFormActivo((prev) => ({
          ...prev,
          nombre: prev.nombre || firstItem?.descripcion || prev.nombre,
          categoria: prev.categoria || firstItem?.categoria || prev.categoria,
          cantidad_total: firstItem?.cantidad ?? prev.cantidad_total,
          compra_subtotal: data.subtotal ?? prev.compra_subtotal,
          compra_iva: data.iva ?? prev.compra_iva,
          compra_total: data.total ?? prev.compra_total,
          proveedor_compra: data.proveedor ?? prev.proveedor_compra,
          fecha_compra: data.fecha_compra ?? prev.fecha_compra,
          compra_descripcion: firstItem?.descripcion ?? prev.compra_descripcion,
        }))
      } else {
        alert(data?.error || "No se pudo leer la factura con IA")
      }
    } catch (error) {
      console.error("Error al escanear factura de activo:", error)
      alert("No se pudo leer la factura con IA")
    }

    setUploadingFactura(false)
  }

  const handleFacturaCompraUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFacturaCompra(true)
    const name = `factura_activo_${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage.from("facturas-activos").upload(name, file)
    if (uploadError) {
      setUploadingFacturaCompra(false)
      return alert(uploadError.message)
    }

    const { data: urlData } = supabase.storage.from("facturas-activos").getPublicUrl(name)
    const facturaUrl = urlData.publicUrl

    setFacturaForm((prev) => ({ ...prev, factura_url: facturaUrl }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/escanear-factura-activo", { method: "POST", body: formData })
      const data = await response.json()
      if (response.ok) {
        setFacturaForm((prev) => ({
          ...prev,
          proveedor: data.proveedor ?? prev.proveedor,
          telefono_proveedor: data.telefono_proveedor ?? prev.telefono_proveedor,
          fecha_compra: data.fecha_compra ?? prev.fecha_compra,
          subtotal: data.subtotal ?? prev.subtotal,
          iva: data.iva ?? prev.iva,
          total: data.total ?? prev.total,
        }))

        setFacturaItems(
          Array.isArray(data.items)
            ? data.items.map((item: any) => ({
                categoria: item.categoria || "",
                cantidad: item.cantidad || "",
                descripcion: item.descripcion || "",
                subtotal: item.subtotal || "",
                iva: item.iva || "",
                total: item.total || "",
              }))
            : []
        )
      } else {
        alert(data?.error || "No se pudo leer la factura con IA")
      }
    } catch (error) {
      console.error("Error al escanear factura de activo:", error)
      alert("No se pudo leer la factura con IA")
    }

    setUploadingFacturaCompra(false)
  }

  const handleCrearActivo = async () => {
    const nombreFinal = formActivo.nombre || formActivo.compra_descripcion
    if (!nombreFinal || !formActivo.cantidad_total) {
      return alert("Descripcion y cantidad son obligatorios")
    }
    setLoading(true)
    const total = Number(formActivo.cantidad_total) || 0
    const { error } = await supabase.from("activos").insert([
      {
        nombre: nombreFinal,
        categoria: formActivo.categoria || null,
        cantidad_total: total,
        cantidad_disponible: total,
        ubicacion_actual: formActivo.ubicacion_actual || null,
        compra_subtotal: parseMoney(formActivo.compra_subtotal),
        compra_iva: parseMoney(formActivo.compra_iva),
        compra_total: getCompraTotal(formActivo.compra_subtotal, formActivo.compra_iva, formActivo.compra_total),
        proveedor_compra: formActivo.proveedor_compra || null,
        fecha_compra: formActivo.fecha_compra || null,
        factura_url: formActivo.factura_url || null,
        compra_descripcion: formActivo.compra_descripcion || null,
      },
    ])
    if (error) {
      alert(error.message)
    } else {
      setShowNuevo(false)
      setFormActivo({
        nombre: "",
        categoria: "",
        cantidad_total: "",
        ubicacion_actual: "",
        compra_subtotal: "",
        compra_iva: "",
        compra_total: "",
        proveedor_compra: "",
        fecha_compra: "",
        factura_url: "",
        compra_descripcion: "",
      })
      fetchData()
    }
    setLoading(false)
  }

  const getFacturaTotals = () => {
    return facturaItems.reduce(
      (acc, item) => {
        const subtotal = parseMoney(item.subtotal) || 0
        const iva = parseMoney(item.iva) || 0
        const total = getItemTotal(item.subtotal, item.iva, item.total) || 0
        return {
          subtotal: acc.subtotal + subtotal,
          iva: acc.iva + iva,
          total: acc.total + total,
        }
      },
      { subtotal: 0, iva: 0, total: 0 }
    )
  }

  const handleGuardarFactura = async () => {
    if (!facturaItems.some((item) => item.descripcion)) {
      return alert("Agrega al menos un articulo")
    }

    setLoading(true)
    try {
      const totals = getFacturaTotals()
      const { data: factura, error: facturaError } = await supabase
        .from("facturas_activos")
        .insert([
          {
            proveedor: facturaForm.proveedor || null,
            telefono_proveedor: facturaForm.telefono_proveedor || null,
            fecha_compra: facturaForm.fecha_compra || null,
            subtotal: totals.subtotal,
            iva: totals.iva,
            total: totals.total,
            factura_url: facturaForm.factura_url || null,
          },
        ])
        .select()
        .single()

      if (facturaError) throw facturaError

      const itemsPayload = facturaItems
        .filter((item) => item.descripcion)
        .map((item) => ({
          factura_id: factura.id,
          categoria: item.categoria || null,
          cantidad: parseMoney(item.cantidad),
          descripcion: item.descripcion || null,
          subtotal: parseMoney(item.subtotal),
          iva: parseMoney(item.iva),
          total: getItemTotal(item.subtotal, item.iva, item.total),
        }))

      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from("facturas_activos_items").insert(itemsPayload)
        if (itemsError) throw itemsError
      }

      setShowNuevaFactura(false)
      setFacturaForm({
        proveedor: "",
        telefono_proveedor: "",
        fecha_compra: new Date().toISOString().split("T")[0],
        subtotal: "",
        iva: "",
        total: "",
        factura_url: "",
      })
      setFacturaItems([])
      await fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarMovimiento = async () => {
    if (!activoSeleccionado?.id) return
    if (!formMovimiento.fecha_movimiento) return alert("Fecha requerida")

    const cantidad = Number(formMovimiento.cantidad) || 0
    const tipo = formMovimiento.tipo_movimiento
    let delta = 0
    if (tipo === "ENTRADA" || tipo === "DEVOLUCION") delta = cantidad
    if (tipo === "SALIDA") delta = -cantidad
    if (tipo === "AJUSTE") delta = cantidad

    const nuevoDisponible = (Number(activoSeleccionado.cantidad_disponible) || 0) + delta
    const responsableId = formMovimiento.responsable_id || null
    const unidadId = formMovimiento.unidad_id || null

    setLoading(true)
    try {
      let responsivaUrl = null
      if (archivoResponsiva) {
        responsivaUrl = await subirResponsiva(archivoResponsiva, activoSeleccionado.id)
      }

      const { error: movError } = await supabase.from("movimientos_activos").insert([
        {
          activo_id: activoSeleccionado.id,
          tipo_movimiento: tipo,
          cantidad,
          responsable_id: responsableId,
          unidad_id: unidadId,
          ubicacion: formMovimiento.ubicacion || null,
          fecha_movimiento: formMovimiento.fecha_movimiento,
          notas: formMovimiento.notas || null,
          responsiva_url: responsivaUrl,
        },
      ])
      if (movError) throw movError

      const { error: actError } = await supabase
        .from("activos")
        .update({
          cantidad_disponible: tipo === "TRASLADO" ? activoSeleccionado.cantidad_disponible : nuevoDisponible,
          ubicacion_actual: formMovimiento.ubicacion || activoSeleccionado.ubicacion_actual || null,
          responsable_id: responsableId,
          unidad_id: unidadId,
        })
        .eq("id", activoSeleccionado.id)
      if (actError) throw actError

      setShowMovimiento(false)
      setArchivoResponsiva(null)
      setFormMovimiento({
        tipo_movimiento: "ENTRADA",
        cantidad: "",
        responsable_id: "",
        unidad_id: "",
        ubicacion: "",
        fecha_movimiento: new Date().toISOString().split("T")[0],
        notas: "",
      })
      await fetchMovimientos(activoSeleccionado.id)
      await fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border-b-4 border-yellow-400">
          <div className="flex items-center gap-3">
            <Box className="h-8 w-8 text-yellow-600" />
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Equipo y Activo</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowNuevaFactura(true)}
              style={{ backgroundColor: AMEL_YELLOW, color: "#000" }}
              className="font-black italic px-6 h-10 shadow-md"
            >
              <FileText className="mr-2 h-4 w-4" /> NUEVA FACTURA
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNuevo(true)}
              className="font-black italic px-6 h-10 shadow-md"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> NUEVO ACTIVO
            </Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <Input
                  placeholder="Buscar por articulo o categoria..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="text-xs text-zinc-500">{activosFiltrados.length} activos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-zinc-900 text-white p-4">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <FileText size={18} /> Facturas de compra
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow className="text-xs font-black uppercase">
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead className="text-center">Fecha</TableHead>
                  <TableHead className="text-center">Total (con IVA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((f) => (
                  <TableRow key={f.id} className="hover:bg-zinc-50 text-sm">
                    <TableCell className="font-bold">{f.proveedor || "-"}</TableCell>
                    <TableCell>{f.telefono_proveedor || "-"}</TableCell>
                    <TableCell className="text-center">{f.fecha_compra || "-"}</TableCell>
                    <TableCell className="text-center font-black text-green-600">
                      {f.total ? `$${Number(f.total).toLocaleString("es-MX")}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-zinc-900 text-white p-4">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <ClipboardList size={18} /> Inventario de activos
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow className="text-xs font-black uppercase">
                  <TableHead>Articulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-center">Compra</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activosFiltrados.map((a) => (
                  <TableRow key={a.id} className="hover:bg-zinc-50 text-sm">
                    <TableCell className="font-bold">{a.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {a.categoria || "Sin categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black">
                      {Number(a.cantidad_disponible || 0).toLocaleString()} / {Number(a.cantidad_total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{a.proveedor_compra || "-"}</TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {getCompraTotal(a.compra_subtotal, a.compra_iva, a.compra_total)
                        ? `$${Number(getCompraTotal(a.compra_subtotal, a.compra_iva, a.compra_total)).toLocaleString("es-MX")}`
                        : "-"}
                    </TableCell>
                    <TableCell>{personalById.get(a.responsable_id) || "-"}</TableCell>
                    <TableCell>{unidadesById.get(a.unidad_id) || "-"}</TableCell>
                    <TableCell>{a.ubicacion_actual || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setActivoSeleccionado(a)
                          await fetchMovimientos(a.id)
                          setShowDetalle(true)
                        }}
                      >
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Modal nuevo activo */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Nuevo activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
              value={formActivo.categoria}
              onChange={(e) => setFormActivo({ ...formActivo, categoria: e.target.value })}
            >
              <option value="">Categoria</option>
              <option value="EPP">Equipo de Proteccion Personal</option>
              <option value="SEGURIDAD">Equipo de Seguridad</option>
              <option value="DIAGNOSTICO">Equipo de Diagnostico</option>
              <option value="HERRAMIENTA">Herramienta</option>
              <option value="AUXILIAR">Equipo Auxiliar</option>
              <option value="OTRO">Otro</option>
            </select>
            <Input
              type="number"
              placeholder="Cantidad total"
              value={formActivo.cantidad_total}
              onChange={(e) => setFormActivo({ ...formActivo, cantidad_total: e.target.value })}
            />
            <Input
              placeholder="Ubicacion inicial"
              value={formActivo.ubicacion_actual}
              onChange={(e) => setFormActivo({ ...formActivo, ubicacion_actual: e.target.value })}
            />
            <div className="border rounded-lg p-3 space-y-2 bg-zinc-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-zinc-600">Factura de compra</p>
                <label className="text-xs text-blue-600 cursor-pointer">
                  <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFacturaActivoUpload} />
                  {uploadingFactura ? "Escaneando..." : "Subir + IA"}
                </label>
              </div>
              <p className="text-[10px] text-zinc-500">
                La IA completa cantidad, proveedor, fecha, descripcion y sugerencia de categoria.
              </p>
              <Input
                placeholder="Proveedor"
                value={formActivo.proveedor_compra}
                onChange={(e) => setFormActivo({ ...formActivo, proveedor_compra: e.target.value })}
              />
              <Input
                type="date"
                value={formActivo.fecha_compra}
                onChange={(e) => setFormActivo({ ...formActivo, fecha_compra: e.target.value })}
              />
              <Input
                placeholder="Descripcion del producto"
                value={formActivo.compra_descripcion}
                onChange={(e) => setFormActivo({ ...formActivo, compra_descripcion: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Subtotal"
                  value={formActivo.compra_subtotal}
                  onChange={(e) => setFormActivo({ ...formActivo, compra_subtotal: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="IVA"
                  value={formActivo.compra_iva}
                  onChange={(e) => setFormActivo({ ...formActivo, compra_iva: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Total"
                  value={getCompraTotal(formActivo.compra_subtotal, formActivo.compra_iva, formActivo.compra_total) || ""}
                  readOnly
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              className="w-full font-black"
              style={{ backgroundColor: AMEL_YELLOW, color: "#000" }}
              onClick={handleCrearActivo}
              disabled={loading}
            >
              GUARDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal nueva factura */}
      <Dialog open={showNuevaFactura} onOpenChange={setShowNuevaFactura}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-3 space-y-2 bg-zinc-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-zinc-600">Factura de compra</p>
                <label className="text-xs text-blue-600 cursor-pointer">
                  <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFacturaCompraUpload} />
                  {uploadingFacturaCompra ? "Escaneando..." : "Subir + IA"}
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Proveedor"
                  value={facturaForm.proveedor}
                  onChange={(e) => setFacturaForm({ ...facturaForm, proveedor: e.target.value })}
                />
                <Input
                  placeholder="Telefono proveedor"
                  value={facturaForm.telefono_proveedor}
                  onChange={(e) => setFacturaForm({ ...facturaForm, telefono_proveedor: e.target.value })}
                />
                <Input
                  type="date"
                  value={facturaForm.fecha_compra}
                  onChange={(e) => setFacturaForm({ ...facturaForm, fecha_compra: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase">Articulos</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFacturaItems((prev) => [
                      ...prev,
                      { categoria: "", cantidad: "", descripcion: "", subtotal: "", iva: "", total: "" },
                    ])
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Agregar articulo
                </Button>
              </div>

              {facturaItems.length === 0 ? (
                <div className="text-xs text-zinc-500">Sin articulos</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {facturaItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded-lg p-2">
                      <div className="md:col-span-2">
                        <select
                          className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
                          value={item.categoria}
                          onChange={(e) => {
                            const next = [...facturaItems]
                            next[idx] = { ...next[idx], categoria: e.target.value }
                            setFacturaItems(next)
                          }}
                        >
                          <option value="">Categoria</option>
                          <option value="EPP">EPP</option>
                          <option value="SEGURIDAD">SEGURIDAD</option>
                          <option value="DIAGNOSTICO">DIAGNOSTICO</option>
                          <option value="HERRAMIENTA">HERRAMIENTA</option>
                          <option value="AUXILIAR">AUXILIAR</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={item.cantidad}
                          onChange={(e) => {
                            const next = [...facturaItems]
                            next[idx] = { ...next[idx], cantidad: e.target.value }
                            setFacturaItems(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Input
                          placeholder="Descripcion"
                          value={item.descripcion}
                          onChange={(e) => {
                            const next = [...facturaItems]
                            next[idx] = { ...next[idx], descripcion: e.target.value }
                            setFacturaItems(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          type="number"
                          placeholder="Subtotal"
                          value={item.subtotal}
                          onChange={(e) => {
                            const next = [...facturaItems]
                            next[idx] = { ...next[idx], subtotal: e.target.value }
                            setFacturaItems(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Input
                          type="number"
                          placeholder="IVA"
                          value={item.iva}
                          onChange={(e) => {
                            const next = [...facturaItems]
                            next[idx] = { ...next[idx], iva: e.target.value }
                            setFacturaItems(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 text-right text-xs font-bold">
                        ${Number(getItemTotal(item.subtotal, item.iva, item.total) || 0).toLocaleString("es-MX")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-900 text-white p-4 rounded-2xl flex items-center justify-between">
              <div className="text-xs font-bold uppercase">Total con IVA</div>
              <div className="text-2xl font-black">
                ${Number(getFacturaTotals().total).toLocaleString("es-MX")}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              className="w-full font-black"
              style={{ backgroundColor: AMEL_YELLOW, color: "#000" }}
              onClick={handleGuardarFactura}
              disabled={loading}
            >
              GUARDAR FACTURA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Detalle de activo</DialogTitle>
          </DialogHeader>
          {activoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-bold">Articulo:</span> {activoSeleccionado.nombre}</div>
                <div><span className="font-bold">Categoria:</span> {activoSeleccionado.categoria || "-"}</div>
                <div><span className="font-bold">Stock:</span> {Number(activoSeleccionado.cantidad_disponible || 0).toLocaleString()} / {Number(activoSeleccionado.cantidad_total || 0).toLocaleString()}</div>
                <div><span className="font-bold">Ubicacion:</span> {activoSeleccionado.ubicacion_actual || "-"}</div>
                <div><span className="font-bold">Responsable:</span> {personalById.get(activoSeleccionado.responsable_id) || "-"}</div>
                <div><span className="font-bold">Unidad:</span> {unidadesById.get(activoSeleccionado.unidad_id) || "-"}</div>
                <div><span className="font-bold">Proveedor:</span> {activoSeleccionado.proveedor_compra || "-"}</div>
                <div><span className="font-bold">Fecha compra:</span> {activoSeleccionado.fecha_compra || "-"}</div>
                <div className="col-span-2"><span className="font-bold">Descripcion compra:</span> {activoSeleccionado.compra_descripcion || "-"}</div>
                <div><span className="font-bold">Subtotal:</span> ${Number(activoSeleccionado.compra_subtotal || 0).toLocaleString("es-MX")}</div>
                <div><span className="font-bold">IVA:</span> ${Number(activoSeleccionado.compra_iva || 0).toLocaleString("es-MX")}</div>
                <div className="col-span-2"><span className="font-bold">Total:</span> ${Number(getCompraTotal(activoSeleccionado.compra_subtotal, activoSeleccionado.compra_iva, activoSeleccionado.compra_total) || 0).toLocaleString("es-MX")}</div>
                {activoSeleccionado.factura_url && (
                  <div className="col-span-2">
                    <a className="text-blue-600 text-xs underline" href={activoSeleccionado.factura_url} target="_blank" rel="noreferrer">
                      Ver factura
                    </a>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowMovimiento(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Registrar movimiento
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase">Historial de movimientos</h4>
                {movimientos.length === 0 ? (
                  <div className="text-xs text-zinc-500">Sin movimientos</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {movimientos.map((m) => (
                      <div key={m.id} className="border rounded-lg p-3 text-sm bg-zinc-50">
                        <div className="flex justify-between">
                          <span className="font-bold">{m.tipo_movimiento}</span>
                          <span className="text-xs text-zinc-500">{m.fecha_movimiento}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>Cantidad: {Number(m.cantidad || 0).toLocaleString()}</div>
                          <div>Ubicacion: {m.ubicacion || "-"}</div>
                          <div>Responsable: {personalById.get(m.responsable_id) || "-"}</div>
                          <div>Unidad: {unidadesById.get(m.unidad_id) || "-"}</div>
                        </div>
                        {m.responsiva_url && (
                          <div className="mt-2">
                            <a className="text-blue-600 text-xs underline" href={m.responsiva_url} target="_blank" rel="noreferrer">
                              Ver responsiva
                            </a>
                          </div>
                        )}
                        {m.notas && <div className="mt-2 text-xs text-zinc-600">{m.notas}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal movimiento */}
      <Dialog open={showMovimiento} onOpenChange={setShowMovimiento}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Registrar movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
              value={formMovimiento.tipo_movimiento}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo_movimiento: e.target.value })}
            >
              {movimientoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder={formMovimiento.tipo_movimiento === "AJUSTE" ? "Cantidad (+/-)" : "Cantidad"}
              value={formMovimiento.cantidad}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })}
            />
            <select
              className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
              value={formMovimiento.responsable_id}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, responsable_id: e.target.value })}
            >
              <option value="">Responsable (opcional)</option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>{`${p.nombre || ""} ${p.apellido || ""}`.trim()}</option>
              ))}
            </select>
            <select
              className="w-full h-10 text-xs font-bold p-2 rounded border bg-white"
              value={formMovimiento.unidad_id}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, unidad_id: e.target.value })}
            >
              <option value="">Unidad (opcional)</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.economico}</option>
              ))}
            </select>
            <Input
              placeholder="Ubicacion (bodega, patio, unidad)"
              value={formMovimiento.ubicacion}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, ubicacion: e.target.value })}
            />
            <Input
              type="date"
              value={formMovimiento.fecha_movimiento}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, fecha_movimiento: e.target.value })}
            />
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Notas"
              value={formMovimiento.notas}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, notas: e.target.value })}
            />
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Responsiva (opcional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setArchivoResponsiva(e.target.files?.[0] || null)}
                />
                <FileUp className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              className="w-full font-black"
              style={{ backgroundColor: AMEL_YELLOW, color: "#000" }}
              onClick={handleRegistrarMovimiento}
              disabled={loading}
            >
              GUARDAR MOVIMIENTO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
