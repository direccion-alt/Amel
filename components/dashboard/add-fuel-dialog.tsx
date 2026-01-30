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

interface AddFuelDialogProps {
  units: Pick<Unit, "id" | "unit_number" | "plate_number">[]
}

export function AddFuelDialog({ units }: AddFuelDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from("fuel_records").insert({
      unit_id: formData.get("unit_id") as string,
      date: formData.get("date") as string,
      odometer_reading: formData.get("odometer_reading")
        ? Number.parseFloat(formData.get("odometer_reading") as string)
        : null,
      fuel_liters: formData.get("fuel_liters") ? Number.parseFloat(formData.get("fuel_liters") as string) : null,
      fuel_cost: formData.get("fuel_cost") ? Number.parseFloat(formData.get("fuel_cost") as string) : null,
      fuel_type: (formData.get("fuel_type") as string) || "diesel",
      notes: (formData.get("notes") as string) || null,
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
          Registrar Carga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Carga de Combustible</DialogTitle>
            <DialogDescription>Ingresa los datos de la carga de combustible.</DialogDescription>
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
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="odometer_reading">Odómetro (km)</Label>
                <Input id="odometer_reading" name="odometer_reading" type="number" step="0.01" placeholder="150000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel_liters">Litros</Label>
                <Input id="fuel_liters" name="fuel_liters" type="number" step="0.01" placeholder="200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fuel_cost">Costo Total</Label>
                <Input id="fuel_cost" name="fuel_cost" type="number" step="0.01" placeholder="4500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel_type">Tipo</Label>
                <Select name="fuel_type" defaultValue="diesel">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diésel</SelectItem>
                    <SelectItem value="gasoline">Gasolina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Observaciones adicionales..." />
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
