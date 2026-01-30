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
import { MoreHorizontal, Shield, User, Truck } from "lucide-react"
import type { Profile, Unit, UserUnit } from "@/lib/types"

interface UsersTableProps {
  users: Profile[]
  units: Unit[]
  userUnits: UserUnit[]
}

export function UsersTable({ users, units, userUnits }: UsersTableProps) {
  const router = useRouter()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Unidades Asignadas</TableHead>
            <TableHead>Fecha de Registro</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.role)}>
                          <Shield className="mr-2 h-4 w-4" />
                          {user.role === "admin" ? "Quitar admin" : "Hacer admin"}
                        </DropdownMenuItem>
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
