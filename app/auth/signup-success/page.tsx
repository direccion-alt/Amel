import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6 md:p-10 relative overflow-hidden">
      {/* Decoraciones */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFDE18] rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFDE18] rounded-full blur-3xl opacity-10" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center">
            <Image
              src="/amel-logo-icon.jpg"
              alt="AMEL Transportes Especializados"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <Card className="border-none shadow-2xl bg-white">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFDE18]">
                <Mail className="h-8 w-8 text-black" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">Revisa tu correo</CardTitle>
              <CardDescription className="text-gray-500">Te hemos enviado un enlace de confirmación</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.
              </p>
              <Button asChild className="w-full h-11 bg-black text-white font-semibold hover:bg-gray-800">
                <Link href="/auth/login">Volver al inicio de sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
