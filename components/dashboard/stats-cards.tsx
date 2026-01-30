import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Fuel, Route, Wrench, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalUnits: number
    activeUnits: number
    totalFuelCost: number
    totalTrips: number
    completedTrips: number
    pendingMaintenance: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unidades Activas</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUnits}</div>
          <p className="text-xs text-muted-foreground">de {stats.totalUnits} unidades totales</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto en Combustible</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalFuelCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Viajes Completados</CardTitle>
          <Route className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedTrips}</div>
          <p className="text-xs text-muted-foreground">de {stats.totalTrips} viajes este mes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mantenimiento Pendiente</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {stats.pendingMaintenance > 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-orange-500" />
                Requieren atención
              </>
            ) : (
              "Todo al día"
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
