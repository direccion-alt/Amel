import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-black p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-xl font-black uppercase">Cuenta en revisión</h1>
        <p className="mt-3 text-sm text-white/70">
          Tu registro fue recibido. Un administrador debe aprobar tu acceso antes de que puedas ingresar al sistema.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild className="bg-[#FFDE18] text-black hover:bg-[#ffe64d]">
            <Link href="/auth/login">Volver al login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
