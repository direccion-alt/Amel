import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trip, Unit } from "@/lib/types"

interface RecentTripsProps {
  trips: (Trip & { unit?: Unit })[]
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
}

export function RecentTrips({ trips }: RecentTripsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Viajes Recientes</CardTitle>
        <CardDescription>Últimos viajes registrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay viajes registrados</p>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {trip.origin} → {trip.destination}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {trip.unit?.unit_number || "Sin unidad"} • {trip.client_name || "Sin cliente"}
                  </p>
                </div>
                <Badge variant="secondary" className={statusColors[trip.status]}>
                  {statusLabels[trip.status]}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
