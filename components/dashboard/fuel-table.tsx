"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FuelRecord, Unit } from "@/lib/types"
import { Fuel } from "lucide-react"

interface FuelTableProps {
  records: (FuelRecord & { unit?: Pick<Unit, "unit_number" | "plate_number"> | null })[]
  isAdmin: boolean
  units: Pick<Unit, "id" | "unit_number" | "plate_number">[]
}

export function FuelTable({ records }: FuelTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Odómetro</TableHead>
            <TableHead>Litros</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Precio/Litro</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Fuel className="h-8 w-8" />
                  <p>No hay registros de combustible</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString("es-MX")}</TableCell>
                <TableCell className="font-medium">{record.unit?.unit_number || "N/A"}</TableCell>
                <TableCell>{record.odometer_reading?.toLocaleString() || "-"} km</TableCell>
                <TableCell>{record.fuel_liters?.toLocaleString() || "-"} L</TableCell>
                <TableCell>${record.fuel_cost?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "-"}</TableCell>
                <TableCell>
                  {record.fuel_liters && record.fuel_cost
                    ? `$${(record.fuel_cost / record.fuel_liters).toFixed(2)}`
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">{record.notes || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
