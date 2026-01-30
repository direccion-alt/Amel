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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      {/* Panel izquierdo con branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12 relative overflow-hidden">
        {/* Decoración con el amarillo AMEL */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFDE18] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFDE18] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center gap-8">
            <Image
              src="/amel-logo-black-bg.jpg"
              alt="AMEL Transportes Especializados"
              width={400}
              height={200}
              className="object-contain"
              priority
            />
            <p className="text-gray-300 mt-4 max-w-md text-lg leading-relaxed">
              Sistema integral de gestión y monitoreo de unidades de transporte
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div className="flex lg:hidden items-center justify-center mb-6">
              <Image
                src="/images/recurso-202.png"
                alt="AMEL Transportes Especializados"
                width={200}
                height={80}
                className="object-contain"
              />
            </div>

            <Card className="border-none shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-black">Iniciar Sesión</CardTitle>
                <CardDescription className="text-gray-500">
                  Ingresa tus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-black font-medium">
                        Correo electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#FFDE18] focus:ring-[#FFDE18]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password" className="text-black font-medium">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-gray-300 focus:border-[#FFDE18] focus:ring-[#FFDE18]"
                      />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full h-11 bg-[#FFDE18] text-black font-semibold hover:bg-[#e6c816] transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                  </div>
                  <div className="mt-6 text-center text-sm text-gray-600">
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
      </div>
    </div>
  )
}
