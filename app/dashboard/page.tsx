import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { FuelChart } from "@/components/dashboard/fuel-chart"
import { RecentTrips } from "@/components/dashboard/recent-trips"
import { UnitStatus } from "@/components/dashboard/unit-status"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()

  // Obtener unidades (RLS filtra automáticamente según permisos)
  const { data: units } = await supabase.from("units").select("*")

  // Obtener estadísticas de combustible del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: fuelRecords } = await supabase.from("fuel_records").select("*").gte("date", startOfMonth.toISOString())

  // Obtener viajes
  const { data: trips } = await supabase
    .from("trips")
    .select("*, unit:units(*)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Obtener mantenimientos pendientes
  const { data: maintenance } = await supabase
    .from("maintenance_records")
    .select("*")
    .gte("next_maintenance_date", new Date().toISOString())
    .lte("next_maintenance_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

  // Calcular estadísticas
  const totalUnits = units?.length || 0
  const activeUnits = units?.filter((u) => u.status === "active").length || 0
  const totalFuelCost = fuelRecords?.reduce((sum, r) => sum + (r.fuel_cost || 0), 0) || 0
  const totalTrips = trips?.length || 0
  const completedTrips = trips?.filter((t) => t.status === "completed").length || 0
  const pendingMaintenance = maintenance?.length || 0

  // Datos para el gráfico (simulados por ahora, se pueden obtener de Google Sheets)
  const chartData = [
    { month: "Ago", cost: 45000, liters: 1200 },
    { month: "Sep", cost: 52000, liters: 1400 },
    { month: "Oct", cost: 48000, liters: 1300 },
    { month: "Nov", cost: 55000, liters: 1500 },
    { month: "Dic", cost: 62000, liters: 1700 },
    { month: "Ene", cost: totalFuelCost || 58000, liters: 1600 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">
          Bienvenido, {profile?.full_name || "Usuario"}. Aquí está el resumen de tu flota.
        </p>
      </div>

      <StatsCards
        stats={{
          totalUnits,
          activeUnits,
          totalFuelCost,
          totalTrips,
          completedTrips,
          pendingMaintenance,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <FuelChart data={chartData} />
        <UnitStatus units={units || []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTrips trips={trips || []} />
      </div>
    </div>
  )
}
