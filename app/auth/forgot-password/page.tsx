"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      })
      if (resetError) throw resetError
      setMessage("Te enviamos un correo para restablecer tu contraseña.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-black p-6">
      <Card className="w-full max-w-md border border-white/20 bg-white/90 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-black">Recuperar contraseña</CardTitle>
          <CardDescription className="text-zinc-600">Te enviaremos un enlace a tu correo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-black font-semibold">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
            <div className="text-center text-sm text-zinc-600">
              <Link href="/auth/login" className="font-semibold text-black hover:text-[#FFDE18]">
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
