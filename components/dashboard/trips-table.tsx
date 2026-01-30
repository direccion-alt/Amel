"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Route, CheckCircle, XCircle, PlayCircle } from "lucide-react"
import type { Trip, Unit } from "@/lib/types"

interface TripsTableProps {
  trips: (Trip & { unit?: Pick<Unit, "unit_number" | "plate_number"> | null })[]
  isAdmin: boolean
  units: Pick<Unit, "id" | "unit_number" | "plate_number">[]
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
}

export function TripsTable({ trips, isAdmin }: TripsTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    setLoadingId(tripId)
    const supabase = createClient()

    await supabase.from("trips").update({ status: newStatus }).eq("id", tripId)

    setLoadingId(null)
    router.refresh()
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unidad</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Salida</TableHead>
            <TableHead>Llegada</TableHead>
            <TableHead>Distancia</TableHead>
            <TableHead>Estado</TableHead>
            {isAdmin && <TableHead className="w-[100px]">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Route className="h-8 w-8" />
                  <p>No hay viajes registrados</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.unit?.unit_number || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{trip.origin}</span>
                    <span className="text-xs text-muted-foreground">→ {trip.destination}</span>
                  </div>
                </TableCell>
                <TableCell>{trip.client_name || "-"}</TableCell>
                <TableCell className="text-sm">
                  {trip.departure_date ? new Date(trip.departure_date).toLocaleDateString("es-MX") : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString("es-MX") : "-"}
                </TableCell>
                <TableCell>{trip.distance_km ? `${trip.distance_km.toLocaleString()} km` : "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[trip.status]}>
                    {statusLabels[trip.status]}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loadingId === trip.id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "in_progress")}>
                          <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                          En progreso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "completed")}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Completado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "cancelled")}>
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
