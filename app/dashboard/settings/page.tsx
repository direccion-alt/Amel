import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/dashboard/settings-form"
import { GoogleSheetsConfig } from "@/components/dashboard/google-sheets-config"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()

  // Solo admins pueden ver configuración completa
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Configura las integraciones y preferencias del sistema</p>
      </div>

      <div className="grid gap-6">
        <SettingsForm profile={profile} />
        <GoogleSheetsConfig />
      </div>
    </div>
  )
}
