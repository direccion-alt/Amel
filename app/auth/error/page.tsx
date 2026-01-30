import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-10" />
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">Algo salió mal</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {params?.error ? (
                <p className="text-sm text-gray-600 bg-red-50 p-4 rounded-lg mb-6">Error: {params.error}</p>
              ) : (
                <p className="text-sm text-gray-600 mb-6">Ha ocurrido un error inesperado.</p>
              )}
              <Button asChild className="w-full h-11 bg-[#FFDE18] text-black font-semibold hover:bg-[#e6c816]">
                <Link href="/auth/login">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
