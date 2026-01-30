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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Unit } from "@/lib/types"

interface EditUnitDialogProps {
  unit: Unit
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUnitDialog({ unit, open, onOpenChange }: EditUnitDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase
      .from("units")
      .update({
        unit_number: formData.get("unit_number") as string,
        plate_number: formData.get("plate_number") as string,
        brand: (formData.get("brand") as string) || null,
        model: (formData.get("model") as string) || null,
        year: formData.get("year") ? Number.parseInt(formData.get("year") as string) : null,
        status: formData.get("status") as string,
        zeek_device_id: (formData.get("zeek_device_id") as string) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", unit.id)

    setIsLoading(false)

    if (!error) {
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Unidad</DialogTitle>
            <DialogDescription>Modifica los datos de la unidad {unit.unit_number}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit_number">Número de Unidad *</Label>
              <Input id="unit_number" name="unit_number" defaultValue={unit.unit_number} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plate_number">Placas *</Label>
              <Input id="plate_number" name="plate_number" defaultValue={unit.plate_number} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" name="brand" defaultValue={unit.brand || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" name="model" defaultValue={unit.model || ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Año</Label>
                <Input id="year" name="year" type="number" defaultValue={unit.year || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select name="status" defaultValue={unit.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zeek_device_id">ID Dispositivo Zeek GPS</Label>
              <Input id="zeek_device_id" name="zeek_device_id" defaultValue={unit.zeek_device_id || ""} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
