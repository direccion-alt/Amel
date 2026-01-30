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

interface AddMaintenanceDialogProps {
  units: Pick<Unit, "id" | "unit_number" | "plate_number">[]
}

const maintenanceTypes = [
  "Cambio de aceite",
  "Cambio de llantas",
  "Frenos",
  "Afinación",
  "Revisión general",
  "Transmisión",
  "Sistema eléctrico",
  "Suspensión",
  "Otro",
]

export function AddMaintenanceDialog({ units }: AddMaintenanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from("maintenance_records").insert({
      unit_id: formData.get("unit_id") as string,
      date: formData.get("date") as string,
      maintenance_type: formData.get("maintenance_type") as string,
      description: (formData.get("description") as string) || null,
      cost: formData.get("cost") ? Number.parseFloat(formData.get("cost") as string) : null,
      provider: (formData.get("provider") as string) || null,
      odometer_at_service: formData.get("odometer_at_service")
        ? Number.parseFloat(formData.get("odometer_at_service") as string)
        : null,
      next_maintenance_date: (formData.get("next_maintenance_date") as string) || null,
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
          Registrar Mantenimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Mantenimiento</DialogTitle>
            <DialogDescription>Ingresa los datos del servicio de mantenimiento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit_id">Unidad *</Label>
                <Select name="unit_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maintenance_type">Tipo de Mantenimiento *</Label>
              <Select name="maintenance_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="Detalles del servicio realizado..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Costo</Label>
                <Input id="cost" name="cost" type="number" step="0.01" placeholder="5000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="odometer_at_service">Odómetro (km)</Label>
                <Input
                  id="odometer_at_service"
                  name="odometer_at_service"
                  type="number"
                  step="0.01"
                  placeholder="150000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="provider">Proveedor</Label>
                <Input id="provider" name="provider" placeholder="Taller Mecánico XYZ" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="next_maintenance_date">Próximo Servicio</Label>
                <Input id="next_maintenance_date" name="next_maintenance_date" type="date" />
              </div>
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
