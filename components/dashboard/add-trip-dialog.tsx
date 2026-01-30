"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Unit } from "@/lib/types"

interface AddTripDialogProps {
  units: Pick<Unit, "id" | "unit_number" | "plate_number">[]
}

export function AddTripDialog({ units }: AddTripDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from("trips").insert({
      unit_id: formData.get("unit_id") as string,
      origin: formData.get("origin") as string,
      destination: formData.get("destination") as string,
      departure_date: (formData.get("departure_date") as string) || null,
      client_name: (formData.get("client_name") as string) || null,
      cargo_description: (formData.get("cargo_description") as string) || null,
      distance_km: formData.get("distance_km") ? Number.parseFloat(formData.get("distance_km") as string) : null,
      status: "pending",
    })

    setIsLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Viaje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Viaje</DialogTitle>
            <DialogDescription>Ingresa los datos del viaje.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit_id">Unidad *</Label>
              <Select name="unit_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.plate_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="origin">Origen *</Label>
                <Input id="origin" name="origin" placeholder="Ciudad de México" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destino *</Label>
                <Input id="destination" name="destination" placeholder="Monterrey" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="departure_date">Fecha de Salida</Label>
                <Input id="departure_date" name="departure_date" type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="distance_km">Distancia (km)</Label>
                <Input id="distance_km" name="distance_km" type="number" step="0.01" placeholder="920" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_name">Cliente</Label>
              <Input id="client_name" name="client_name" placeholder="Nombre del cliente" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cargo_description">Descripción de Carga</Label>
              <Textarea id="cargo_description" name="cargo_description" placeholder="Descripción de la mercancía..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
