"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const userId = data.user?.id
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("status").eq("id", userId).single()
        if (profile?.status !== "approved") {
          await supabase.auth.signOut()
          router.push("/auth/pending")
          return
        }
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      <Image
        src="/VP_03%20(3).jpg"
        alt="Unidades AMEL"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex min-h-svh w-full items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md border border-white/20 bg-white/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center justify-center">
              <Image
                src="/amel-logo-white-bg.png"
                alt="AMEL Transportes Especializados"
                width={140}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-black text-black">Iniciar Sesión</CardTitle>
            <CardDescription className="text-zinc-600">
              Acceso exclusivo para personal AMEL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-black font-semibold">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-zinc-300 focus:border-[#FFDE18] focus:ring-[#FFDE18]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-black font-semibold">
                    Contraseña
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
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#FFDE18] text-black font-black hover:bg-[#ffe64d] transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm text-zinc-600">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-black hover:text-[#FFDE18] transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
