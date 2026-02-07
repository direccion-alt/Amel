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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, MoreHorizontal, Shield, User, Truck, XCircle } from "lucide-react"
import type { Profile, Unit, UserUnit } from "@/lib/types"

interface UsersTableProps {
  users: Profile[]
  units: Unit[]
  userUnits: UserUnit[]
}

export function UsersTable({ users, units, userUnits }: UsersTableProps) {
  const router = useRouter()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const PERMISSIONS = [
    { key: "dashboard", label: "Panel General" },
    { key: "units", label: "Unidades" },
    { key: "operators", label: "Operadores" },
    { key: "rutas", label: "Rutas Operativas" },
    { key: "casetas", label: "Casetas" },
    { key: "control_diesel", label: "Control de Diesel" },
    { key: "trips", label: "Logística" },
    { key: "analisis", label: "Análisis Financiero" },
    { key: "mantenimiento", label: "Mantenimiento" },
    { key: "tracking", label: "Rastreo GPS" },
    { key: "users", label: "Usuarios" },
    { key: "settings", label: "Configuración" },
  ]

  const getUserUnits = (userId: string) => {
    const assignedUnitIds = userUnits.filter((uu) => uu.user_id === userId).map((uu) => uu.unit_id)
    return units.filter((u) => assignedUnitIds.includes(u.id))
  }

  const isUnitAssigned = (userId: string, unitId: string) => {
    return userUnits.some((uu) => uu.user_id === userId && uu.unit_id === unitId)
  }

  const handleToggleUnit = async (userId: string, unitId: string, assigned: boolean) => {
    setLoadingUserId(userId)
    const supabase = createClient()

    if (assigned) {
      await supabase.from("user_units").delete().eq("user_id", userId).eq("unit_id", unitId)
    } else {
      await supabase.from("user_units").insert({ user_id: userId, unit_id: unitId })
    }

    setLoadingUserId(null)
    router.refresh()
  }

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    setLoadingUserId(userId)
    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({ role: currentRole === "admin" ? "user" : "admin" })
      .eq("id", userId)

    setLoadingUserId(null)
    router.refresh()
  }

  const handleUpdateStatus = async (userId: string, status: "pending" | "approved" | "rejected") => {
    setLoadingUserId(userId)
    const supabase = createClient()

    await supabase.from("profiles").update({ status }).eq("id", userId)

    setLoadingUserId(null)
    router.refresh()
  }

  const handleTogglePermission = async (userId: string, key: string, value: boolean, current?: Record<string, boolean>) => {
    setLoadingUserId(userId)
    const supabase = createClient()

    const nextPermissions = {
      ...(current || {}),
      [key]: value,
    }

    await supabase.from("profiles").update({ permissions: nextPermissions }).eq("id", userId)

    setLoadingUserId(null)
    router.refresh()
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
              <TableHead>Estatus</TableHead>
            <TableHead>Unidades Asignadas</TableHead>
            <TableHead>Fecha de Registro</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const assignedUnits = getUserUnits(user.id)
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      {user.full_name || "Sin nombre"}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === "approved" && <Badge className="bg-green-100 text-green-700">Aprobado</Badge>}
                    {user.status === "pending" && <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>}
                    {user.status === "rejected" && <Badge className="bg-red-100 text-red-700">Rechazado</Badge>}
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <span className="text-muted-foreground text-sm">Todas las unidades</span>
                    ) : assignedUnits.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedUnits.slice(0, 3).map((unit) => (
                          <Badge key={unit.id} variant="outline" className="text-xs">
                            {unit.unit_number}
                          </Badge>
                        ))}
                        {assignedUnits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignedUnits.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin unidades</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loadingUserId === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, "approved")}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprobar acceso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, "rejected")}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar acceso
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.role)}>
                          <Shield className="mr-2 h-4 w-4" />
                          {user.role === "admin" ? "Quitar admin" : "Hacer admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Permisos</DropdownMenuLabel>
                        {PERMISSIONS.map((perm) => (
                          <DropdownMenuCheckboxItem
                            key={perm.key}
                            checked={user.permissions?.[perm.key] ?? false}
                            onCheckedChange={(checked) =>
                              handleTogglePermission(user.id, perm.key, Boolean(checked), user.permissions)
                            }
                          >
                            {perm.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Asignar Unidades
                        </DropdownMenuLabel>
                        {units.map((unit) => (
                          <DropdownMenuCheckboxItem
                            key={unit.id}
                            checked={isUnitAssigned(user.id, unit.id)}
                            onCheckedChange={() => handleToggleUnit(user.id, unit.id, isUnitAssigned(user.id, unit.id))}
                          >
                            {unit.unit_number} - {unit.plate_number}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
