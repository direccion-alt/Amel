"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import type { Profile } from "@/lib/types"

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    setIsLoading(false)

    if (error) {
      setMessage({ type: "error", text: "Error al guardar los cambios" })
    } else {
      setMessage({ type: "success", text: "Cambios guardados correctamente" })
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Perfil de Usuario
        </CardTitle>
        <CardDescription>Actualiza tu información personal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name || ""} placeholder="Tu nombre" />
          </div>
          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
