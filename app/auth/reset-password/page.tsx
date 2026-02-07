"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMessage("Ingresa tu nueva contrasena.")
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.")
      return
    }

    if (password !== confirm) {
      setError("Las contrasenas no coinciden.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setMessage("Contrasena actualizada. Ya puedes iniciar sesion.")
      setTimeout(() => router.push("/auth/login"), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contrasena")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-black p-6">
      <Card className="w-full max-w-md border border-white/20 bg-white/90 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-black">Restablecer contrasena</CardTitle>
          <CardDescription className="text-zinc-600">Escribe tu nueva contrasena</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-black font-semibold">
                Nueva contrasena
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-zinc-300 focus:border-[#FFDE18] focus:ring-[#FFDE18]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm" className="text-black font-semibold">
                Confirmar contrasena
              </Label>
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 border-zinc-300 focus:border-[#FFDE18] focus:ring-[#FFDE18]"
              />
            </div>
            {message && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{message}</p>}
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Button
              type="submit"
              className="w-full h-11 bg-[#FFDE18] text-black font-black hover:bg-[#ffe64d] transition-colors"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Actualizar contrasena"}
            </Button>
            <div className="text-center text-sm text-zinc-600">
              <Link href="/auth/login" className="font-semibold text-black hover:text-[#FFDE18]">
                Volver a iniciar sesion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
