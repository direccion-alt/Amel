import { createClient } from "@/lib/supabase/server"
import { FuelTable } from "@/components/dashboard/fuel-table"
import { AddFuelDialog } from "@/components/dashboard/add-fuel-dialog"

export default async function FuelPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()

  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("*, unit:units(unit_number, plate_number)")
    .order("date", { ascending: false })

  const { data: units } = await supabase.from("units").select("id, unit_number, plate_number")

  const isAdmin = profile?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Combustible</h1>
          <p className="text-muted-foreground">Registro de cargas de combustible y rendimiento</p>
        </div>
        {isAdmin && <AddFuelDialog units={units || []} />}
      </div>

      <FuelTable records={fuelRecords || []} isAdmin={isAdmin} units={units || []} />
    </div>
  )
}
