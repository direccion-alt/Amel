import { createClient } from "@/lib/supabase/server"
import { TrackingView } from "@/components/dashboard/tracking-view"

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: units } = await supabase
    .from("units")
    .select("id, unit_number, plate_number, zeek_device_id, status")
    .order("unit_number")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rastreo GPS</h1>
        <p className="text-muted-foreground">Visualiza la ubicación en tiempo real de tus unidades</p>
      </div>

      <TrackingView units={units || []} selectedUnitId={params.unit} />
    </div>
  )
}
