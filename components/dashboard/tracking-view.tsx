"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, AlertCircle } from "lucide-react"
import type { Unit } from "@/lib/types"

interface TrackingViewProps {
  units: Pick<Unit, "id" | "unit_number" | "plate_number" | "zeek_device_id" | "status">[]
  selectedUnitId?: string
}

export function TrackingView({ units, selectedUnitId }: TrackingViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>(selectedUnitId || "")

  const currentUnit = units.find((u) => u.id === selectedUnit)
  const unitsWithGps = units.filter((u) => u.zeek_device_id)

  // Construir la URL del iframe de Zeek GPS
  // Nota: Esta URL es un ejemplo, deberás ajustarla según la documentación de Zeek GPS
  const getZeekIframeUrl = (deviceId: string) => {
    // URL de ejemplo - ajustar según la plataforma Zeek GPS real
    return `https://app.zeekgps.com/embed/track/${deviceId}`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Panel lateral con lista de unidades */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Unidades</CardTitle>
          <CardDescription>Selecciona una unidad para rastrear</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {unitsWithGps.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {unit.unit_number}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lista de unidades con GPS */}
          <div className="space-y-2">
            {unitsWithGps.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No hay unidades con GPS configurado</p>
              </div>
            ) : (
              unitsWithGps.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnit(unit.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedUnit === unit.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`h-4 w-4 ${unit.status === "active" ? "text-green-500" : "text-muted-foreground"}`}
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium">{unit.unit_number}</p>
                      <p className="text-xs text-muted-foreground">{unit.plate_number}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      unit.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : unit.status === "maintenance"
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-gray-500/10 text-gray-500"
                    }
                  >
                    {unit.status === "active" ? "Activa" : unit.status === "maintenance" ? "Mant." : "Inactiva"}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Área del mapa */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {currentUnit ? `Ubicación de ${currentUnit.unit_number}` : "Mapa de Rastreo"}
          </CardTitle>
          {currentUnit && <CardDescription>ID Dispositivo: {currentUnit.zeek_device_id}</CardDescription>}
        </CardHeader>
        <CardContent>
          {currentUnit && currentUnit.zeek_device_id ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
              {/* Iframe de Zeek GPS */}
              <iframe
                src={getZeekIframeUrl(currentUnit.zeek_device_id)}
                className="absolute inset-0 w-full h-full"
                title={`Rastreo GPS de ${currentUnit.unit_number}`}
                allow="geolocation"
                loading="lazy"
              />
              {/* Fallback/placeholder mientras carga o si no está disponible */}
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 pointer-events-none opacity-0 transition-opacity">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg border bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Selecciona una unidad</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Elige una unidad de la lista para ver su ubicación en tiempo real
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
