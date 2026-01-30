import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersTable } from "@/components/dashboard/users-table"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()

  // Solo admins pueden ver esta página
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const { data: units } = await supabase.from("units").select("*").order("unit_number")

  const { data: userUnits } = await supabase.from("user_units").select("*")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios y sus unidades asignadas</p>
      </div>

      <UsersTable users={users || []} units={units || []} userUnits={userUnits || []} />
    </div>
  )
}
