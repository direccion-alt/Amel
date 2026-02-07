"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, XCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PendingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single()

    setStatus(profile?.status || "pending")

    if (profile?.status === "approved") {
      setTimeout(() => router.push("/dashboard"), 1500)
    }
    setChecking(false)
  }

  useEffect(() => {
    checkStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const isRejected = status === "rejected"
  const isApproved = status === "approved"

  return (
    <div className="flex min-h-svh items-center justify-center bg-foreground p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border border-border/20 bg-background shadow-2xl">
          <CardHeader className="space-y-2 pb-4 text-center">
            <div className="flex justify-center mb-2">
              {isRejected ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              ) : isApproved ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-black text-foreground">
              {isRejected
                ? "Acceso Denegado"
                : isApproved
                  ? "Cuenta Aprobada"
                  : "Cuenta en Revision"}
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              {isRejected
                ? "Tu solicitud de acceso ha sido rechazada. Contacta al administrador si crees que es un error."
                : isApproved
                  ? "Tu cuenta ha sido aprobada. Redirigiendo al panel de control..."
                  : "Tu registro fue recibido. Un administrador debe aprobar tu acceso antes de que puedas ingresar al sistema."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!isApproved && (
              <Button
                onClick={checkStatus}
                disabled={checking}
                className="w-full h-11 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
              >
                {checking ? "Verificando..." : "Verificar Estado"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-11 font-semibold"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
