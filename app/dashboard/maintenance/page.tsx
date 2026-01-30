import { createClient } from "@/lib/supabase/server"
import { MaintenanceTable } from "@/components/dashboard/maintenance-table"
import { AddMaintenanceDialog } from "@/components/dashboard/add-maintenance-dialog"

export default async function MaintenancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()

  const { data: records } = await supabase
    .from("maintenance_records")
    .select("*, unit:units(unit_number, plate_number)")
    .order("date", { ascending: false })

  const { data: units } = await supabase.from("units").select("id, unit_number, plate_number")

  const isAdmin = profile?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mantenimiento</h1>
          <p className="text-muted-foreground">Historial y programación de mantenimientos</p>
        </div>
        {isAdmin && <AddMaintenanceDialog units={units || []} />}
      </div>

      <MaintenanceTable records={records || []} />
    </div>
  )
}
