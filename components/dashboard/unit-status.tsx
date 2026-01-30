import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Unit } from "@/lib/types"
import { Truck } from "lucide-react"

interface UnitStatusProps {
  units: Unit[]
}

const statusColors = {
  active: "bg-green-500/10 text-green-500",
  inactive: "bg-gray-500/10 text-gray-500",
  maintenance: "bg-orange-500/10 text-orange-500",
}

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
  maintenance: "Mantenimiento",
}

export function UnitStatus({ units }: UnitStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Unidades</CardTitle>
        <CardDescription>Resumen del estado actual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay unidades asignadas</p>
          ) : (
            units.slice(0, 5).map((unit) => (
              <div key={unit.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{unit.unit_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {unit.brand} {unit.model} • {unit.plate_number}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={statusColors[unit.status]}>
                  {statusLabels[unit.status]}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
