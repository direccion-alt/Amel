"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, MapPin } from "lucide-react"
import type { Unit, Profile } from "@/lib/types"
import { EditUnitDialog } from "./edit-unit-dialog"
import { DeleteUnitDialog } from "./delete-unit-dialog"
import Link from "next/link"

interface UnitsTableProps {
  units: (Unit & { owner?: Pick<Profile, "full_name" | "email"> | null })[]
  isAdmin: boolean
}

const statusColors = {
  active: "bg-green-500/10 text-green-500",
  inactive: "bg-gray-500/10 text-gray-500",
  maintenance: "bg-orange-500/10 text-orange-500",
}

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
  maintenance: "Mantenimiento",
}

export function UnitsTable({ units, isAdmin }: UnitsTableProps) {
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay unidades registradas
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_number}</TableCell>
                  <TableCell>{unit.plate_number}</TableCell>
                  <TableCell>
                    {unit.brand} {unit.model} {unit.year && `(${unit.year})`}
                  </TableCell>
                  <TableCell>
                    {unit.owner ? (
                      <span className="text-sm">{unit.owner.full_name || unit.owner.email}</span>
                    ) : (
                      <span className="text-muted-foreground">Propia</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[unit.status]}>
                      {statusLabels[unit.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {unit.zeek_device_id && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tracking?unit=${unit.id}`}>
                              <MapPin className="mr-2 h-4 w-4" />
                              Ver ubicación
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => setEditingUnit(unit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingUnit(unit)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUnit && (
        <EditUnitDialog unit={editingUnit} open={!!editingUnit} onOpenChange={() => setEditingUnit(null)} />
      )}

      {deletingUnit && (
        <DeleteUnitDialog unit={deletingUnit} open={!!deletingUnit} onOpenChange={() => setDeletingUnit(null)} />
      )}
    </>
  )
}
