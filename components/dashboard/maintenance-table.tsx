"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { MaintenanceRecord, Unit } from "@/lib/types"
import { Wrench, AlertTriangle } from "lucide-react"

interface MaintenanceTableProps {
  records: (MaintenanceRecord & { unit?: Pick<Unit, "unit_number" | "plate_number"> | null })[]
}

export function MaintenanceTable({ records }: MaintenanceTableProps) {
  const isOverdue = (nextDate: string | null) => {
    if (!nextDate) return false
    return new Date(nextDate) < new Date()
  }

  const isUpcoming = (nextDate: string | null) => {
    if (!nextDate) return false
    const next = new Date(nextDate)
    const now = new Date()
    const diff = next.getTime() - now.getTime()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000 // 30 días
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Odómetro</TableHead>
            <TableHead>Próximo Mantenimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Wrench className="h-8 w-8" />
                  <p>No hay registros de mantenimiento</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString("es-MX")}</TableCell>
                <TableCell className="font-medium">{record.unit?.unit_number || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{record.maintenance_type}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{record.description || "-"}</TableCell>
                <TableCell>
                  {record.cost ? `$${record.cost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "-"}
                </TableCell>
                <TableCell>{record.odometer_at_service?.toLocaleString() || "-"} km</TableCell>
                <TableCell>
                  {record.next_maintenance_date ? (
                    <div className="flex items-center gap-2">
                      {isOverdue(record.next_maintenance_date) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <span
                        className={
                          isOverdue(record.next_maintenance_date)
                            ? "text-red-500 font-medium"
                            : isUpcoming(record.next_maintenance_date)
                              ? "text-orange-500"
                              : ""
                        }
                      >
                        {new Date(record.next_maintenance_date).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
