import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative min-h-screen">
        <Image
          src="/images/Copia%20de%20trailer%20atardecer%203%20dron.png"
          alt="Flota AMEL"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#FFDE18] text-black flex items-center justify-center font-black text-lg">
              A
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">AMEL Transportes Especializados</div>
              <div className="text-[11px] text-white/70">Acceso interno</div>
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">
            Portal de acceso
          </h1>
          <p className="mt-3 text-sm text-white/70">
            Área exclusiva para personal autorizado de AMEL.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 rounded-lg bg-[#FFDE18] px-8 py-3 text-xs font-black uppercase text-black hover:bg-[#ffe64d]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
